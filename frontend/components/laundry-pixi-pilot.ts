import { Application, Container, Graphics, Text } from 'pixi.js';
import type { SortConfig, SortState } from '@shared/game';

// An opt-in experiment. No simulation, input, persistence, or independent clock lives here.
export async function createLaundryPilot(host: HTMLElement, onLost: () => void) {
  const app = new Application();
  await app.init({
    width: host.clientWidth,
    height: host.clientHeight,
    resolution: Math.min(2, window.devicePixelRatio || 1),
    autoDensity: true,
    preference: 'webgl',
    antialias: true,
    autoStart: false,
    background: '#d6f0f1',
  });
  host.append(app.canvas);
  app.canvas.setAttribute('aria-hidden', 'true');
  app.canvas.addEventListener('webglcontextlost', onLost);
  const scene = new Container();
  app.stage.addChild(scene);
  const room = new Graphics()
    .rect(0, 760, 1000, 240)
    .fill('#82b89a')
    .roundRect(55, 120, 230, 310, 34)
    .fill('#f7efdc')
    .stroke({ color: '#07172b', width: 13 })
    .circle(170, 290, 82)
    .fill('#56e7ed')
    .stroke({ color: '#07172b', width: 13 })
    .rect(350, 135, 560, 18)
    .fill('#86a896');
  for (const [x, color] of [
    [420, '#56e7ed'],
    [560, '#ff755f'],
    [710, '#f6df49'],
  ] as const) {
    room.roundRect(x, 30, 70, 105, 12).fill(color).stroke({ color: '#07172b', width: 8 });
    room.rect(x + 18, 20, 34, 18).fill('#07172b');
  }
  room
    .poly([55, 1000, 55, 760, 440, 690, 465, 1000])
    .fill('#f0eadc')
    .stroke({ color: '#07172b', width: 13 });
  room
    .poly([535, 1000, 560, 690, 945, 760, 945, 1000])
    .fill('#28344a')
    .stroke({ color: '#07172b', width: 13 });
  for (let row = 0; row < 4; row++) {
    room
      .moveTo(70, 790 + row * 48)
      .lineTo(435, 725 + row * 60)
      .stroke({ color: '#b3aa96', width: 8 });
    room
      .moveTo(565, 725 + row * 60)
      .lineTo(930, 790 + row * 48)
      .stroke({ color: '#65718a', width: 8 });
  }
  scene.addChild(room);
  const drum = new Graphics();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    drum
      .moveTo(0, 0)
      .lineTo(Math.cos(a) * 48, Math.sin(a) * 48)
      .stroke({ color: '#f7efdc', width: 10 });
  }
  drum.position.set(170, 290);
  scene.addChild(drum);
  const shadow = new Graphics().ellipse(0, 0, 90, 18).fill({ color: '#07172b', alpha: 0.18 });
  shadow.position.set(500, 670);
  scene.addChild(shadow);
  const garment = new Graphics();
  scene.addChild(garment);
  const score = new Text({
    text: '',
    style: { fontFamily: 'Arial', fontSize: 27, fontWeight: 'bold', fill: '#07172b' },
  });
  score.anchor.set(0.5);
  score.position.set(500, 65);
  scene.addChild(score);
  const particles = Array.from({ length: 10 }, (_, i) => {
    const bubble = new Graphics().circle(0, 0, 7 + (i % 3)).fill({ color: '#fff4df', alpha: 0.8 });
    scene.addChild(bubble);
    return bubble;
  });
  let lastToken = '';
  const resize = () => {
    app.renderer.resize(host.clientWidth, host.clientHeight);
    scene.scale.set(host.clientWidth / 1000, host.clientHeight / 1000);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return {
    render(config: SortConfig, state: SortState, reduced: boolean) {
      const item = config.items[state.currentItemIndex ?? -1];
      garment.visible = !!item;
      if (item && item.token !== lastToken) {
        lastToken = item.token;
        garment.clear();
        if (item.token.includes('sock'))
          garment.poly([-50, -90, 48, -90, 35, 30, 78, 55, 72, 96, 5, 108, -42, 55]);
        else if (item.token.includes('shirt'))
          garment.poly([
            -72, -55, -120, -15, -82, 40, -52, 18, -52, 95, 52, 95, 52, 18, 82, 40, 120, -15, 72,
            -55, 0, -28,
          ]);
        else garment.roundRect(-92, -75, 184, 150, 12);
        garment.fill(
          item.token.startsWith('white')
            ? '#f7efdc'
            : item.token.startsWith('yellow')
              ? '#f6df49'
              : item.token.startsWith('red')
                ? '#ff755f'
                : '#142d52',
        );
        garment.stroke({ color: '#526375', width: 8 });
        garment.moveTo(-35, -45).lineTo(25, -45).stroke({ color: '#97a1ad', width: 5 });
      }
      garment.position.set(500, 210 + state.itemProgress * 470);
      garment.rotation = reduced ? 0 : Math.sin(state.tick * 0.11) * 0.13;
      drum.rotation = reduced ? 0 : state.tick * 0.05;
      score.text = `${state.correct} SORTED · ×${state.combo}`;
      particles.forEach((p, i) => {
        p.visible = !reduced && state.feedbackTicks > 0;
        const age = 16 - state.feedbackTicks;
        p.position.set(500 + Math.cos(i * 2.4) * age * 13, 610 + Math.sin(i * 2.4) * age * 9);
        p.alpha = state.feedbackTicks / 16;
      });
      app.render();
    },
    destroy() {
      observer.disconnect();
      app.canvas.removeEventListener('webglcontextlost', onLost);
      app.destroy(true, { children: true });
    },
  };
}
