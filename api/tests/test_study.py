"""Tests for the SM-2 spaced-repetition study service + router."""
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlmodel import Session

from models.flashcard import Flashcard
from schemas.study import ReviewQuality
from services import study as study_service


class TestApplySm2:
    """The SM-2 algorithm — the scheduling heart."""

    def _fresh_card(self) -> Flashcard:
        return Flashcard(question="Q", answer="A", video_id=1)

    def test_quality_again_resets_repetitions(self) -> None:
        card = self._fresh_card()
        card.repetitions = 5
        card.interval = 30

        study_service._apply_sm2(card, quality_score=1)

        assert card.repetitions == 0
        assert card.interval == 1

    def test_first_good_review_sets_interval_to_1_day(self) -> None:
        card = self._fresh_card()

        study_service._apply_sm2(card, quality_score=4)

        assert card.interval == 1
        assert card.repetitions == 1

    def test_second_good_review_sets_interval_to_6_days(self) -> None:
        card = self._fresh_card()
        card.repetitions = 1
        card.interval = 1

        study_service._apply_sm2(card, quality_score=4)

        assert card.interval == 6
        assert card.repetitions == 2

    def test_third_review_multiplies_by_ease_factor(self) -> None:
        card = self._fresh_card()
        card.repetitions = 2
        card.interval = 6
        card.ease_factor = 2.5

        study_service._apply_sm2(card, quality_score=4)

        # interval should be round(6 * 2.5) = 15
        assert card.interval == 15
        assert card.repetitions == 3

    def test_ease_factor_never_falls_below_minimum(self) -> None:
        card = self._fresh_card()
        card.ease_factor = 1.3

        # Lowest-grade pass repeatedly to drive ease down
        for _ in range(10):
            study_service._apply_sm2(card, quality_score=0)

        assert card.ease_factor >= study_service.MIN_EASE_FACTOR

    def test_easy_review_increases_ease_factor(self) -> None:
        card = self._fresh_card()
        initial = card.ease_factor

        study_service._apply_sm2(card, quality_score=5)

        assert card.ease_factor > initial

    def test_hard_review_decreases_ease_factor(self) -> None:
        card = self._fresh_card()
        initial = card.ease_factor

        study_service._apply_sm2(card, quality_score=3)

        assert card.ease_factor < initial

    def test_review_sets_due_date_in_future(self) -> None:
        card = self._fresh_card()
        before = datetime.utcnow()

        study_service._apply_sm2(card, quality_score=4)

        assert card.due_date > before
        assert card.last_reviewed is not None

    def test_failed_review_due_tomorrow(self) -> None:
        card = self._fresh_card()
        card.interval = 30
        card.repetitions = 5

        study_service._apply_sm2(card, quality_score=1)

        assert card.interval == 1
        # Due date is 1 day from now
        expected = datetime.utcnow() + timedelta(days=1)
        assert abs((card.due_date - expected).total_seconds()) < 60


class TestGetDueCards:
    def test_returns_only_cards_past_due(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        video = make_video()
        due = make_flashcard(video_id=video.id, question="Due")
        future = make_flashcard(video_id=video.id, question="Future")
        future.due_date = datetime.utcnow() + timedelta(days=5)
        session.add(future)
        session.commit()

        result = study_service.get_due_cards(session)

        ids = [c.id for c in result]
        assert due.id in ids
        assert future.id not in ids

    def test_ordered_by_due_date_ascending(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        video = make_video()
        newer = make_flashcard(video_id=video.id, question="Newer")
        older = make_flashcard(video_id=video.id, question="Older")
        older.due_date = datetime.utcnow() - timedelta(days=10)
        session.add(older)
        session.commit()

        result = study_service.get_due_cards(session)

        assert result[0].id == older.id
        assert result[1].id == newer.id

    def test_limit_caps_results(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        video = make_video()
        for _ in range(5):
            make_flashcard(video_id=video.id)

        result = study_service.get_due_cards(session, limit=3)

        assert len(result) == 3

    def test_folder_filter(
        self, session: Session, make_video, make_folder, make_flashcard
    ) -> None:
        video = make_video()
        folder = make_folder()
        make_flashcard(video_id=video.id, folder_id=folder.id)
        make_flashcard(video_id=video.id)  # no folder

        result = study_service.get_due_cards(session, folder_id=folder.id)

        assert len(result) == 1
        assert result[0].folder_id == folder.id

    def test_includes_video_title(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        video = make_video(title="My Video")
        make_flashcard(video_id=video.id)

        result = study_service.get_due_cards(session)

        assert result[0].video_title == "My Video"


class TestReview:
    def test_review_persists_state(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        video = make_video()
        fc = make_flashcard(video_id=video.id)

        study_service.review(session, fc.id, ReviewQuality.GOOD)

        session.refresh(fc)
        assert fc.repetitions == 1
        assert fc.interval == 1
        assert fc.last_reviewed is not None

    def test_review_missing_flashcard_raises(self, session: Session) -> None:
        from fastapi import HTTPException
        import pytest

        with pytest.raises(HTTPException) as exc_info:
            study_service.review(session, 9999, ReviewQuality.GOOD)

        assert exc_info.value.status_code == 404


class TestStats:
    def test_empty_stats(self, session: Session) -> None:
        stats = study_service.get_stats(session)

        assert stats.total_cards == 0
        assert stats.due_now == 0
        assert stats.new_cards == 0

    def test_new_cards_counted(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        video = make_video()
        make_flashcard(video_id=video.id)
        make_flashcard(video_id=video.id)

        stats = study_service.get_stats(session)

        assert stats.total_cards == 2
        assert stats.new_cards == 2
        assert stats.due_now == 2  # all new cards are due immediately

    def test_mature_cards_separated_from_learning(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        video = make_video()
        learning = make_flashcard(video_id=video.id)
        mature = make_flashcard(video_id=video.id)
        learning.repetitions = 1
        mature.repetitions = 5
        session.add(learning)
        session.add(mature)
        session.commit()

        stats = study_service.get_stats(session)

        assert stats.learning_cards == 1
        assert stats.mature_cards == 1
        assert stats.new_cards == 0


class TestStudyRouter:
    def test_due_endpoint(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        video = make_video()
        make_flashcard(video_id=video.id)

        response = client.get("/study/due")

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_review_endpoint(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        video = make_video()
        fc = make_flashcard(video_id=video.id)

        response = client.post(
            f"/study/review/{fc.id}", json={"quality": "good"}
        )

        assert response.status_code == 200
        body = response.json()
        assert body["repetitions"] == 1
        assert body["interval"] == 1

    def test_review_invalid_quality_rejected(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        video = make_video()
        fc = make_flashcard(video_id=video.id)

        response = client.post(
            f"/study/review/{fc.id}", json={"quality": "bogus"}
        )

        assert response.status_code == 422

    def test_review_missing_flashcard_returns_404(
        self, client: TestClient
    ) -> None:
        response = client.post("/study/review/999", json={"quality": "good"})

        assert response.status_code == 404

    def test_stats_endpoint(self, client: TestClient) -> None:
        response = client.get("/study/stats")

        assert response.status_code == 200
        body = response.json()
        for field in (
            "total_cards",
            "due_now",
            "learned_today",
            "new_cards",
            "learning_cards",
            "mature_cards",
        ):
            assert field in body
