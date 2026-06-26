import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { 
  Folder, FileText, Plus, Play, Trash2, X, Terminal as TerminalIcon, 
  Code2, Zap 
} from 'lucide-react';

// Royal Neon Theme Colors
const COLORS = {
  bg: '#0a0a12',
  sidebar: '#12121c',
  editor: '#1a1a24',
  terminal: '#0f0f18',
  accent: '#00f0ff',
  gold: '#ffd700',
  magenta: '#ff00aa',
  text: '#e0e0e0',
  textMuted: '#888',
  border: '#2a2a3a'
};

function App() {
  const [files, setFiles] = useState({
    'README.md': {
      content: `# Welcome to RoyalCode \ud83d\udc51

A beautiful neon-themed VS Code-like editor with integrated terminal.

## Features
- Monaco Editor (same as real VS Code)
- Functional terminal
- File explorer + persistence
- Neon Royal theme
- PWA friendly

Type "help" in the terminal below to see commands.`,
      language: 'markdown'
    },
    'keno-strategy.js': {
      content: `// Keno Royal Strategy Example
const numbers = [7, 14, 21, 28, 35];

function analyzeHotNumbers(hits) {
  return hits.filter(n => numbers.includes(n));
}

console.log("Royal Keno Strategy loaded");
console.log("Hot numbers:", numbers);`,
      language: 'javascript'
    },
    'beastly-facts.txt': {
      content: `BeastlyFacts.com - Premium Pet Care Content

Dexter the Bearded Dragon:
- Current weight: ~550g
- Heart support: furosemide + enalapril
- Enclosure: 6x2x2 zen habitat
- Loves: hydration soaks & high-value meals`,
      language: 'plaintext'
    },
    'App.jsx': {
      content: `import React from 'react';

function App() {
  return (
    <div>
      <h1>RoyalCode is running \ud83d\udd25</h1>
      <p>Edit this file in the editor.</p>
    </div>
  );
}

export default App;`,
      language: 'javascript'
    }
  });

  const [openTabs, setOpenTabs] = useState(['README.md']);
  const [activeTab, setActiveTab] = useState('README.md');
  const [sidebarTab, setSidebarTab] = useState('explorer');
  const [terminalHeight, setTerminalHeight] = useState(280);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);

  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const fitAddon = useRef(null);
  const [currentDir, setCurrentDir] = useState('/');

  useEffect(() => {
    const saved = localStorage.getItem('royalcode_files');
    if (saved) setFiles(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('royalcode_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    if (!terminalRef.current || termInstance.current) return;

    const term = new Terminal({
      theme: {
        background: COLORS.terminal,
        foreground: COLORS.text,
        cursor: COLORS.accent,
        selectionBackground: 'rgba(0, 240, 255, 0.3)',
      },
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
    });

    const addon = new FitAddon();
    term.loadAddon(addon);
    fitAddon.current = addon;

    term.open(terminalRef.current);
    termInstance.current = term;

    term.writeln('\x1b[36m\ud83d\udc51 RoyalCode Terminal v1.0\x1b[0m');
    term.writeln('Type \x1b[33mhelp\x1b[0m for commands.\n');
    term.write('$ ');

    let currentLine = '';

    term.onKey(({ key, domEvent }) => {
      if (domEvent.key === 'Enter') {
        term.write('\r\n');
        handleCommand(currentLine.trim(), term);
        currentLine = '';
      } else if (domEvent.key === 'Backspace') {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else if (key.length === 1) {
        currentLine += key;
        term.write(key);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddon.current) fitAddon.current.fit();
    });
    if (terminalRef.current) resizeObserver.observe(terminalRef.current);

    return () => {
      term.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  const handleCommand = (cmd, term) => {
    if (!term) return;
    const args = cmd.split(' ');
    const command = args[0]?.toLowerCase();
    const arg = args[1];

    term.write(`\r\n`);

    switch (command) {
      case 'help':
        term.writeln('\x1b[36mCommands:\x1b[0m ls | cat <file> | cd | pwd | echo | clear | node <code> | open <file> | run <file>');
        break;
      case 'ls':
        term.writeln(Object.keys(files).join('   '));
        break;
      case 'cat':
        term.writeln(files[arg]?.content || `\x1b[31mFile not found\x1b[0m`);
        break;
      case 'pwd':
        term.writeln(currentDir);
        break;
      case 'cd':
        setCurrentDir(arg || '/');
        term.writeln(`Changed to ${arg || '/'}`);
        break;
      case 'echo':
        term.writeln(args.slice(1).join(' '));
        break;
      case 'clear':
        term.clear();
        term.write('$ ');
        return;
      case 'node':
        try {
          const result = eval(args.slice(1).join(' '));
          term.writeln(String(result));
        } catch (e) {
          term.writeln(`\x1b[31mError: ${e.message}\x1b[0m`);
        }
        break;
      case 'open':
        if (files[arg]) {
          openFile(arg);
          term.writeln(`Opened ${arg}`);
        }
        break;
      case 'run':
        if (files[arg]?.language === 'javascript') {
          try {
            const result = eval(files[arg].content);
            term.writeln(`\x1b[32m\u2713 Ran ${arg}\x1b[0m`);
            if (result !== undefined) term.writeln(String(result));
          } catch (e) {
            term.writeln(`\x1b[31mError: ${e.message}\x1b[0m`);
          }
        } else {
          term.writeln(`\x1b[31mOnly .js files can be run\x1b[0m`);
        }
        break;
      default:
        if (cmd) term.writeln(`\x1b[31mUnknown command: ${command}\x1b[0m`);
    }
    term.write('$ ');
  };

  const openFile = (filename) => {
    if (!openTabs.includes(filename)) {
      setOpenTabs([...openTabs, filename]);
    }
    setActiveTab(filename);
  };

  const closeTab = (filename, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== filename);
    setOpenTabs(newTabs);
    if (activeTab === filename) {
      setActiveTab(newTabs[0] || null);
    }
  };

  const updateFileContent = (newContent) => {
    if (!activeTab) return;
    setFiles(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], content: newContent }
    }));
  };

  const createNewFile = () => {
    const name = prompt('New file name:', 'untitled.js');
    if (!name) return;
    const ext = name.split('.').pop();
    let language = 'plaintext';
    if (['js', 'jsx'].includes(ext)) language = 'javascript';
    if (ext === 'md') language = 'markdown';

    setFiles(prev => ({
      ...prev,
      [name]: { content: '// New file\n', language }
    }));
    openFile(name);
  };

  const deleteFile = (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    const newFiles = { ...files };
    delete newFiles[filename];
    setFiles(newFiles);

    if (openTabs.includes(filename)) {
      const newTabs = openTabs.filter(t => t !== filename);
      setOpenTabs(newTabs);
      if (activeTab === filename) setActiveTab(newTabs[0] || null);
    }
  };

  const currentFile = activeTab ? files[activeTab] : null;

  const runCurrentFile = () => {
    if (!currentFile || currentFile.language !== 'javascript') return alert('Only .js files can be run');
    const term = termInstance.current;
    if (term) {
      term.writeln(`\r\n\x1b[36m\u25b6 Running ${activeTab}...\x1b[0m`);
      try {
        const result = eval(currentFile.content);
        term.writeln(`\x1b[32m\u2713 Success\x1b[0m`);
        if (result !== undefined) term.writeln(String(result));
      } catch (e) {
        term.writeln(`\x1b[31mError: ${e.message}\x1b[0m`);
      }
      term.write('$ ');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: COLORS.bg, color: COLORS.text }}>
      <div style={{ height: 48, background: '#12121c', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 20, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ROYALCODE
        </div>
        <div style={{ fontSize: 11, color: COLORS.accent, background: 'rgba(0,240,255,0.1)', padding: '2px 8px', borderRadius: 4 }}>NEON EDITION</div>
        <div style={{ flex: 1 }} />
        <button onClick={createNewFile} style={{ background: COLORS.accent + '20', color: COLORS.accent, border: `1px solid ${COLORS.accent}40`, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>
          <Plus size={16} /> New File
        </button>
        {currentFile?.language === 'javascript' && (
          <button onClick={runCurrentFile} style={{ background: COLORS.gold + '20', color: COLORS.gold, border: `1px solid ${COLORS.gold}40`, padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>
            <Play size={16} /> Run
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 52, background: COLORS.sidebar, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 8 }}>
          <button onClick={() => setSidebarTab('explorer')} style={{ width: 36, height: 36, borderRadius: 8, background: sidebarTab === 'explorer' ? COLORS.accent + '20' : 'transparent', color: sidebarTab === 'explorer' ? COLORS.accent : COLORS.textMuted, border: 'none', cursor: 'pointer' }}>
            <Folder size={20} />
          </button>
          <button onClick={() => setSidebarTab('search')} style={{ width: 36, height: 36, borderRadius: 8, background: sidebarTab === 'search' ? COLORS.accent + '20' : 'transparent', color: sidebarTab === 'search' ? COLORS.accent : COLORS.textMuted, border: 'none', cursor: 'pointer' }}>
            <Code2 size={20} />
          </button>
        </div>

        <div style={{ width: 260, background: COLORS.sidebar, borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: COLORS.textMuted, borderBottom: `1px solid ${COLORS.border}` }}>
            {sidebarTab === 'explorer' ? 'EXPLORER' : 'SEARCH'}
          </div>
          {sidebarTab === 'explorer' && (
            <div style={{ padding: 8, overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>PROJECT</span>
                <button onClick={createNewFile} style={{ background: 'none', border: 'none', color: COLORS.accent, cursor: 'pointer' }}><Plus size={16} /></button>
              </div>
              {Object.keys(files).map(filename => (
                <div key={filename} onClick={() => openFile(filename)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', background: activeTab === filename ? 'rgba(0,240,255,0.08)' : 'transparent', color: activeTab === filename ? COLORS.accent : COLORS.text }}>
                  <FileText size={16} style={{ color: COLORS.accent + 'aa' }} />
                  <span style={{ flex: 1 }}>{filename}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteFile(filename); }} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ height: 42, background: COLORS.editor, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', paddingLeft: 8 }}>
            {openTabs.map(tab => (
              <div key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: activeTab === tab ? COLORS.bg : 'transparent', borderRight: `1px solid ${COLORS.border}`, cursor: 'pointer', color: activeTab === tab ? COLORS.accent : COLORS.textMuted }}>
                <FileText size={15} />
                {tab}
                <button onClick={(e) => closeTab(tab, e)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer' }}><X size={14} /></button>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, background: COLORS.editor }}>
            {currentFile ? (
              <Editor
                height="100%"
                language={currentFile.language}
                value={currentFile.content}
                onChange={updateFileContent}
                theme="vs-dark"
                options={{ fontSize: 15, minimap: { enabled: true }, wordWrap: 'on', automaticLayout: true, padding: { top: 16 } }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, flexDirection: 'column', gap: 12 }}>
                <Zap size={48} style={{ opacity: 0.3 }} />
                <div>Open a file from the sidebar</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: isTerminalOpen ? terminalHeight : 42, background: COLORS.terminal, borderTop: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
        <div onClick={() => setIsTerminalOpen(!isTerminalOpen)} style={{ height: 42, display: 'flex', alignItems: 'center', padding: '0 16px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', gap: 8 }}>
          <TerminalIcon size={18} style={{ color: COLORS.accent }} />
          <span style={{ fontWeight: 600, fontSize: 13 }}>TERMINAL</span>
          <span style={{ color: COLORS.textMuted, fontSize: 12, marginLeft: 8 }}>Royal Shell • Type "help"</span>
        </div>
        {isTerminalOpen && <div ref={terminalRef} style={{ flex: 1, padding: '8px 12px' }} />}
      </div>

      <div style={{ height: 28, background: '#0f0f1a', borderTop: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 12, color: COLORS.textMuted }}>
        RoyalCode • Neon Edition {currentFile && `• ${activeTab} • ${currentFile.language}`}
        <div style={{ flex: 1 }} />
        <div style={{ color: COLORS.accent }}>Built for you</div>
      </div>
    </div>
  );
}

export default App;