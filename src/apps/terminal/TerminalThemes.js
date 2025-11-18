/**
 * TerminalThemes - Multiple terminal color themes
 * Supports: Matrix, Dracula, Solarized Dark, Nord, Monokai, etc.
 */
export const terminalThemes = {
  matrix: {
    name: 'Matrix (Default)',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    foreground: '#00ff41',
    prompt: '#00d4ff',
    cursor: '#00ff41',
    selection: 'rgba(0, 255, 65, 0.3)',
    scrollbar: {
      track: 'rgba(0, 255, 65, 0.1)',
      thumb: 'rgba(0, 255, 65, 0.3)',
      thumbHover: 'rgba(0, 255, 65, 0.5)'
    },
    header: {
      background: 'rgba(0, 255, 65, 0.1)',
      border: 'rgba(0, 255, 65, 0.3)',
      text: '#00ff41'
    },
    effects: {
      textShadow: '0 0 5px currentColor',
      scanline: true,
      glow: true
    }
  },

  dracula: {
    name: 'Dracula',
    background: '#282a36',
    foreground: '#f8f8f2',
    prompt: '#bd93f9',
    cursor: '#ff79c6',
    selection: 'rgba(189, 147, 249, 0.3)',
    scrollbar: {
      track: '#44475a',
      thumb: '#6272a4',
      thumbHover: '#bd93f9'
    },
    header: {
      background: '#44475a',
      border: '#6272a4',
      text: '#bd93f9'
    },
    colors: {
      black: '#000000',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2'
    },
    effects: {
      textShadow: 'none',
      scanline: false,
      glow: false
    }
  },

  solarized: {
    name: 'Solarized Dark',
    background: '#002b36',
    foreground: '#839496',
    prompt: '#268bd2',
    cursor: '#93a1a1',
    selection: 'rgba(38, 139, 210, 0.3)',
    scrollbar: {
      track: '#073642',
      thumb: '#586e75',
      thumbHover: '#657b83'
    },
    header: {
      background: '#073642',
      border: '#586e75',
      text: '#268bd2'
    },
    colors: {
      black: '#073642',
      red: '#dc322f',
      green: '#859900',
      yellow: '#b58900',
      blue: '#268bd2',
      magenta: '#d33682',
      cyan: '#2aa198',
      white: '#eee8d5'
    },
    effects: {
      textShadow: 'none',
      scanline: false,
      glow: false
    }
  },

  nord: {
    name: 'Nord',
    background: '#2e3440',
    foreground: '#d8dee9',
    prompt: '#88c0d0',
    cursor: '#81a1c1',
    selection: 'rgba(136, 192, 208, 0.3)',
    scrollbar: {
      track: '#3b4252',
      thumb: '#4c566a',
      thumbHover: '#5e81ac'
    },
    header: {
      background: '#3b4252',
      border: '#4c566a',
      text: '#88c0d0'
    },
    colors: {
      black: '#3b4252',
      red: '#bf616a',
      green: '#a3be8c',
      yellow: '#ebcb8b',
      blue: '#81a1c1',
      magenta: '#b48ead',
      cyan: '#88c0d0',
      white: '#e5e9f0'
    },
    effects: {
      textShadow: 'none',
      scanline: false,
      glow: false
    }
  },

  monokai: {
    name: 'Monokai',
    background: '#272822',
    foreground: '#f8f8f2',
    prompt: '#66d9ef',
    cursor: '#f92672',
    selection: 'rgba(102, 217, 239, 0.3)',
    scrollbar: {
      track: '#3e3d32',
      thumb: '#75715e',
      thumbHover: '#a6e22e'
    },
    header: {
      background: '#3e3d32',
      border: '#75715e',
      text: '#a6e22e'
    },
    colors: {
      black: '#272822',
      red: '#f92672',
      green: '#a6e22e',
      yellow: '#f4bf75',
      blue: '#66d9ef',
      magenta: '#ae81ff',
      cyan: '#a1efe4',
      white: '#f8f8f2'
    },
    effects: {
      textShadow: 'none',
      scanline: false,
      glow: false
    }
  },

  'one-dark': {
    name: 'One Dark',
    background: '#282c34',
    foreground: '#abb2bf',
    prompt: '#61afef',
    cursor: '#528bff',
    selection: 'rgba(97, 175, 239, 0.3)',
    scrollbar: {
      track: '#21252b',
      thumb: '#3e4451',
      thumbHover: '#4b5263'
    },
    header: {
      background: '#21252b',
      border: '#3e4451',
      text: '#61afef'
    },
    colors: {
      black: '#282c34',
      red: '#e06c75',
      green: '#98c379',
      yellow: '#e5c07b',
      blue: '#61afef',
      magenta: '#c678dd',
      cyan: '#56b6c2',
      white: '#abb2bf'
    },
    effects: {
      textShadow: 'none',
      scanline: false,
      glow: false
    }
  },

  'gruvbox': {
    name: 'Gruvbox Dark',
    background: '#282828',
    foreground: '#ebdbb2',
    prompt: '#83a598',
    cursor: '#fe8019',
    selection: 'rgba(131, 165, 152, 0.3)',
    scrollbar: {
      track: '#3c3836',
      thumb: '#504945',
      thumbHover: '#665c54'
    },
    header: {
      background: '#3c3836',
      border: '#504945',
      text: '#83a598'
    },
    colors: {
      black: '#282828',
      red: '#cc241d',
      green: '#98971a',
      yellow: '#d79921',
      blue: '#458588',
      magenta: '#b16286',
      cyan: '#689d6a',
      white: '#ebdbb2'
    },
    effects: {
      textShadow: 'none',
      scanline: false,
      glow: false
    }
  },

  'tokyo-night': {
    name: 'Tokyo Night',
    background: '#1a1b26',
    foreground: '#a9b1d6',
    prompt: '#7aa2f7',
    cursor: '#c0caf5',
    selection: 'rgba(122, 162, 247, 0.3)',
    scrollbar: {
      track: '#16161e',
      thumb: '#292e42',
      thumbHover: '#3b4261'
    },
    header: {
      background: '#16161e',
      border: '#292e42',
      text: '#7aa2f7'
    },
    colors: {
      black: '#15161e',
      red: '#f7768e',
      green: '#9ece6a',
      yellow: '#e0af68',
      blue: '#7aa2f7',
      magenta: '#bb9af7',
      cyan: '#7dcfff',
      white: '#a9b1d6'
    },
    effects: {
      textShadow: 'none',
      scanline: false,
      glow: false
    }
  }
};

/**
 * Apply a theme to the terminal
 */
export function applyTheme(theme, container) {
  const t = terminalThemes[theme];
  if (!t) {
    console.error(`Theme not found: ${theme}`);
    return;
  }

  // Apply background
  container.style.background = t.background;
  container.style.color = t.foreground;

  // Apply to output elements
  const outputs = container.querySelectorAll('.terminal-output > div');
  outputs.forEach(output => {
    output.style.color = t.foreground;
    if (t.effects.textShadow) {
      output.style.textShadow = t.effects.textShadow;
    } else {
      output.style.textShadow = 'none';
    }
  });

  // Apply to prompt
  const prompts = container.querySelectorAll('.terminal-prompt');
  prompts.forEach(prompt => {
    prompt.style.color = t.prompt;
    if (t.effects.textShadow) {
      prompt.style.textShadow = `0 0 5px ${t.prompt}`;
    } else {
      prompt.style.textShadow = 'none';
    }
  });

  // Apply to input
  const inputs = container.querySelectorAll('.terminal-input');
  inputs.forEach(input => {
    input.style.color = t.foreground;
    if (t.effects.textShadow) {
      input.style.textShadow = `0 0 5px ${t.foreground}`;
    } else {
      input.style.textShadow = 'none';
    }
  });

  // Apply to header
  const headers = container.querySelectorAll('.terminal-container > div:first-child');
  headers.forEach(header => {
    header.style.background = t.header.background;
    header.style.borderBottom = `2px solid ${t.header.border}`;
    header.querySelector('div').style.color = t.header.text;
  });

  // Toggle effects
  const scanline = container.querySelector('.scanline');
  const glow = container.querySelector('.glow');

  if (scanline) {
    scanline.style.display = t.effects.scanline ? 'block' : 'none';
  }

  if (glow) {
    glow.style.display = t.effects.glow ? 'block' : 'none';
  }

  // Store theme preference
  localStorage.setItem('terminal-theme', theme);
}

/**
 * Get the current theme name
 */
export function getCurrentTheme() {
  return localStorage.getItem('terminal-theme') || 'matrix';
}

/**
 * Get list of available themes
 */
export function getAvailableThemes() {
  return Object.keys(terminalThemes);
}
