import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

function Timeline({ edges, currentStep, onStepChange }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1 within current step
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  const STEP_DURATION = 3000; // 3s per step

  const orderedEdges = useMemo(
    () => edges.filter((e) => e.data?.order != null),
    [edges]
  );

  const minStep = useMemo(
    () => orderedEdges.length > 0 ? Math.min(...orderedEdges.map((e) => e.data.order)) : 0,
    [orderedEdges]
  );

  const maxStep = useMemo(
    () => orderedEdges.length > 0 ? Math.max(...orderedEdges.map((e) => e.data.order)) : 0,
    [orderedEdges]
  );

  // Clamp currentStep to the scoped range
  const clampedStep = Math.max(minStep, Math.min(currentStep, maxStep));

  const handlePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p) {
        // Starting playback — if at max, restart from min
        if (clampedStep >= maxStep) {
          onStepChange(minStep);
          setProgress(0);
        }
        lastTimeRef.current = null;
      }
      return !p;
    });
  }, [clampedStep, maxStep, minStep, onStepChange]);

  // Smooth animation loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (timestamp) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = timestamp;
      }
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setProgress((prev) => {
        const next = prev + delta / STEP_DURATION;
        if (next >= 1) {
          // Advance to next step
          onStepChange((s) => {
            const nextStep = s + 1;
            if (nextStep > maxStep) {
              setPlaying(false);
              return maxStep;
            }
            return nextStep;
          });
          return 0;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, maxStep, onStepChange]);

  // Reset progress when step changes externally (slider drag)
  const prevStepRef = useRef(currentStep);
  if (prevStepRef.current !== currentStep) {
    prevStepRef.current = currentStep;
    if (!playing) setProgress(0);
  }

  // Stop at end
  useEffect(() => {
    if (clampedStep >= maxStep && progress >= 0.99) setPlaying(false);
  }, [clampedStep, maxStep, progress]);

  if (orderedEdges.length === 0) return null;

  // Continuous slider value for smooth visual
  const sliderValue = clampedStep + (playing ? progress : 0);

  return (
    <div className="timeline">
      <button
        className="timeline-play"
        onClick={handlePlay}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? '\u23F8' : '\u25B6'}
      </button>
      <input
        type="range"
        className="timeline-slider"
        min={minStep}
        max={maxStep}
        step="any"
        value={sliderValue}
        onChange={(e) => {
          setPlaying(false);
          const val = Number(e.target.value);
          onStepChange(Math.round(val));
          setProgress(0);
        }}
      />
      <span className="timeline-info">
        <span className="timeline-step">{clampedStep} / {maxStep}</span>
      </span>
      <button
        className="timeline-reset"
        onClick={() => { setPlaying(false); onStepChange(minStep); setProgress(0); }}
        title="Reset"
      >
        &#x21BA;
      </button>
    </div>
  );
}

export default Timeline;
