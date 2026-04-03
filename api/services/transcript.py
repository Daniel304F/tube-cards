import logging
import re
import subprocess
import json

from fastapi import HTTPException
from youtube_transcript_api import YouTubeTranscriptApi

logger = logging.getLogger(__name__)

YOUTUBE_URL_PATTERNS = [
    re.compile(r"(?:youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})"),
]


def extract_video_id(url: str) -> str:
    """Extract the 11-character video ID from a YouTube URL."""
    for pattern in YOUTUBE_URL_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)
    raise HTTPException(status_code=422, detail="Invalid YouTube URL format")


def fetch_transcript(video_id: str) -> str:
    """Fetch and join transcript segments into a single string."""
    try:
        segments = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join(segment["text"] for segment in segments)
        return text.strip()
    except Exception as e:
        logger.error("Transcript fetch failed for %s: %s", video_id, str(e))
        raise HTTPException(
            status_code=422,
            detail=f"Could not fetch transcript for video {video_id}. "
            "The video may not have captions available.",
        )


def fetch_video_title(video_id: str) -> str:
    """Fetch video title using yt-dlp."""
    try:
        result = subprocess.run(
            [
                "yt-dlp",
                "--no-download",
                "--print", "title",
                f"https://www.youtube.com/watch?v={video_id}",
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        title = result.stdout.strip()
        if not title:
            logger.warning("yt-dlp returned empty title for %s", video_id)
            return "Untitled Video"
        return title
    except Exception as e:
        logger.warning("Failed to fetch title for %s: %s", video_id, str(e))
        return "Untitled Video"
