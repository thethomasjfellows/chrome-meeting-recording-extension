import { AutoCaptions } from './AutoCaptions';

describe('automatic captions', () => {
  let captions: AutoCaptions;
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    captions = new AutoCaptions(() => false);
  });
  afterEach(() => { captions.stop(); jest.useRealTimers(); });
  function button(label: string) {
    const el = document.createElement('button');
    el.setAttribute('aria-label', label);
    document.body.appendChild(el);
    return el;
  }
  it('enables off captions once and verifies the changed state during silence', () => {
    const el = button('Turn on captions (c)');
    const click = jest.fn(() => el.setAttribute('aria-label', 'Turn off captions (c)'));
    el.addEventListener('click', click);
    captions.start();
    jest.advanceTimersByTime(15000);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role=alert]')).toBeNull();
  });
  it('never toggles already enabled captions off', () => {
    const click = jest.fn();
    button('Turn off captions').addEventListener('click', click);
    captions.start();
    jest.advanceTimersByTime(10000);
    expect(click).not.toHaveBeenCalled();
  });
  it('supports a localized icon control with explicit pressed state', () => {
    const el = button('자막');
    el.innerHTML = '<i>closed_caption</i>';
    el.setAttribute('aria-pressed', 'false');
    const click = jest.fn(() => el.setAttribute('aria-pressed', 'true'));
    el.addEventListener('click', click);
    captions.start();
    jest.advanceTimersByTime(10000);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role=alert]')).toBeNull();
  });
  it('waits for late controls and clicks only once if activation fails', () => {
    captions.start();
    jest.advanceTimersByTime(2000);
    const click = jest.fn();
    button('Turn on captions').addEventListener('click', click);
    jest.advanceTimersByTime(10000);
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role=alert]')?.textContent).toContain('Turn on CC');
  });
  it('warns on unknown controls then clears after manual activation', () => {
    captions.start();
    jest.advanceTimersByTime(8000);
    expect(document.querySelector('[role=alert]')).not.toBeNull();
    button('Turn off captions');
    jest.advanceTimersByTime(1000);
    expect(document.querySelector('[role=alert]')).toBeNull();
  });
  it('does not click ambiguous controls and removes timers and warnings on stop', () => {
    const click = jest.fn();
    button('Turn on captions').addEventListener('click', click);
    button('Turn on captions').addEventListener('click', click);
    captions.start();
    jest.advanceTimersByTime(8000);
    expect(click).not.toHaveBeenCalled();
    captions.stop();
    expect(jest.getTimerCount()).toBe(0);
    expect(document.querySelector('[role=alert]')).toBeNull();
  });
});
