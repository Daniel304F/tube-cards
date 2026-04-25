"""Extract individual video URLs from a YouTube playlist URL via yt-dlp."""
import logging
import subprocess

from fastapi import HTTPException

logger = logging.getLogger(__name__)

YT_VIDEO_URL_TEMPLATE = "https://www.youtube.com/watch?v={video_id}"


def extract_video_urls(playlist_url: str) -> list[str]:
    """Return one https watch URL per video in the playlist."""
    try:
        result = subprocess.run(
            ["yt-dlp", "--flat-playlist", "--print", "id", playlist_url],
            capture_output=True,
            text=True,
            timeout=60,
        )
    except Exception as e:
        logger.error("yt-dlp failed for playlist %s: %s", playlist_url, str(e))
        raise HTTPException(
            status_code=502, detail="Could not reach yt-dlp to read playlist."
        )

    video_ids = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    if not video_ids:
        raise HTTPException(
            status_code=422, detail="Playlist is empty or could not be read."
        )

    return [YT_VIDEO_URL_TEMPLATE.format(video_id=vid) for vid in video_ids]
