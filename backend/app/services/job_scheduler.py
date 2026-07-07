import asyncio
import logging
from contextlib import suppress

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.services.job_service import JobFetchService

logger = logging.getLogger(__name__)


class JobFetchScheduler:
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._stop_event.clear()
            self._task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        self._stop_event.set()
        if self._task is None:
            return

        self._task.cancel()
        with suppress(asyncio.CancelledError):
            await self._task

    async def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            await self._fetch_once()
            try:
                await asyncio.wait_for(
                    self._stop_event.wait(),
                    timeout=settings.JOB_FETCH_INTERVAL_SECONDS,
                )
            except TimeoutError:
                continue

    async def _fetch_once(self) -> None:
        try:
            async with AsyncSessionLocal() as session:
                service = JobFetchService(session)
                await service.fetch_and_store_jobs()
        except Exception:
            logger.exception("Scheduled job fetch failed.")


job_fetch_scheduler = JobFetchScheduler()
