/** Enable Meet captions once per recording; never blindly toggle an unknown control. */
export class AutoCaptions {
  private timer?: ReturnType<typeof setInterval>;
  private warning?: HTMLElement;

  constructor(private readonly regionActive: () => boolean) {}

  start(): void {
    this.stop();
    let clicked = false;
    let attempts = 0;
    const check = () => {
      attempts++;
      const controls = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'));
      const states = controls.filter(el => !el.hidden && !el.closest('[hidden], [aria-hidden="true"]'))
        .map(el => {
          const label = el.getAttribute('aria-label') ?? '';
          const icon = Array.from(el.querySelectorAll('i, span')).some(child =>
            /^(closed_caption|closed_caption_off)$/.test(child.textContent?.trim() ?? ''));
          const captionControl = /\b(?:turn (?:on|off)|show|hide) captions\b/i.test(label) || icon;
          const pressed = el.getAttribute('aria-pressed');
          const on = /\b(?:turn off|hide) captions\b/i.test(label) || (captionControl && pressed === 'true');
          const off = /\b(?:turn on|show) captions\b/i.test(label) || (captionControl && pressed === 'false');
          return { el, on, off };
        });
      if (states.some(state => state.on) || this.regionActive()) {
        this.warning?.remove();
        this.warning = undefined;
        return;
      }
      const off = states.filter(state => state.off && !state.on &&
        !state.el.hasAttribute('disabled') && state.el.getAttribute('aria-disabled') !== 'true');
      if (!clicked && off.length === 1) {
        clicked = true;
        off[0].el.click();
      }
      if (attempts >= 8 && !this.warning) this.showWarning();
    };
    check();
    this.timer = setInterval(check, 1000);
  }

  stop(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
    this.warning?.remove();
    this.warning = undefined;
  }

  private showWarning(): void {
    const warning = document.createElement('div');
    warning.setAttribute('role', 'alert');
    warning.dataset.recorderCaptionWarning = 'true';
    warning.textContent = 'Recorder: captions are not confirmed on. Turn on CC in Google Meet now so this recording can include a transcript. Audio/video recording continues.';
    warning.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;max-width:640px;width:calc(100% - 64px);padding:16px;border:2px solid #fbbc04;border-radius:8px;background:#202124;color:#fff;font:16px/1.5 sans-serif;box-shadow:0 4px 16px #0008;';
    document.body.appendChild(warning);
    this.warning = warning;
  }
}
