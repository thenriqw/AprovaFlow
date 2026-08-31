export function isQaVisualEnabled() {
  return (import.meta as any).env?.VITE_QA_VISUAL === 'true'
    && new URLSearchParams(window.location.search).get('qaVisual') === '1';
}
