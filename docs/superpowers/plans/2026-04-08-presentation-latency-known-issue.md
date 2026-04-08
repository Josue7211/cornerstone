# Known Issue: Presentation and Chat Cold-Start Latency

Date: 2026-04-08

## Summary

The public site is functional again, but the presentation flow still feels slow on first interaction:

- Bonzi chat can take too long to become responsive after the page loads.
- Slide changes in presentation mode can still feel sluggish.
- The user-visible symptom is delay, not a hard failure.

## What is working

- Bonzi text chat is responding again.
- Kokoro TTS is reachable.
- Autoplay no longer races through slides as aggressively as before.

## Open bug

The remaining issue is startup and transition latency in the public presentation path.

Likely areas to revisit:

- browser-side warmup timing
- narration cache priming
- presentation auto-start sequencing
- any remaining cold network request on the first slide or first chat open

## Next pass

Measure the slow path directly before changing behavior again:

- time from page load to first usable chat response
- time from opening presentation to first spoken slide
- time from slide advance to narration start

Once measured, tune or precompute only the slowest step instead of broadening warmup further.
