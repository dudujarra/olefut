const fs = require('fs');
let content = fs.readFileSync('src/components/MatchView.jsx', 'utf8');

content = content.replace(/transition-all/g, 'transition');

content = content.replace(
  /<div key=\{p\.id\} className="p-2 bg-abyss border border-outline-variant cursor-pointer hover:bg-outline-variant transition-colors" onClick=\{\(\) => setSubUsed\(p\)\}>/g,
  '<button type="button" key={p.id} className="w-full text-left p-2 bg-abyss border border-outline-variant cursor-pointer hover:bg-outline-variant transition-colors" onClick={() => setSubUsed(p)}>'
);

content = content.replace(
  /COND: \{p\.energy\}%<\/span> \| MORAL: \{p\.moral \|\| 50\}%\n\s*<\/div>\n\s*<\/div>/g,
  (match) => match.replace(/<\/div>$/, '</button>')
);

const icons = ['SoccerBall', 'Cardholder', 'FirstAid', 'ArrowsLeftRight', 'Hand', 'Play', 'Pause', 'FastForward', 'SkipForward', 'Megaphone', 'Shield', 'Strategy', 'ListNumbers', 'UserList', 'CheckCircle', 'Warning', 'ChartBar', 'MicrophoneStage', 'ArrowLeft'];

icons.forEach(icon => {
  const regex = new RegExp(`<${icon}([^>]*?)>`, 'g');
  content = content.replace(regex, (match, p1) => {
    if (p1.includes('aria-hidden')) return match;
    return `<${icon} aria-hidden="true"${p1}>`;
  });
});

fs.writeFileSync('src/components/MatchView.jsx', content);
console.log('Fixes applied.');
