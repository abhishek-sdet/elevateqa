/**
 * ELEVATE QA 2026 - ADMIN AI ENGINE (Powered by Ruflo Patterns)
 * Simulates an Agentic Workflow for content optimization and summit orchestration.
 */

const AI_INSIGHTS = {
  copywriter: [
    { 
      tag: "Conversion Lift", score: "+18%", 
      content: "Suggesting headline update: 'Elevate Quality. [[Prove Value.]]' -> 'Architecting the Future of [[AI-Led Quality.]]'",
      action: () => applyAISuggestion('hero-headline', 'Architecting the Future of [[AI-Led Quality.]]')
    },
    { 
      tag: "Brand Alignment", score: "98/100", 
      content: "Tagline optimization: Add more emphasis on 'Practitioner-led' stories to align with the Ruflo 'Proof of Value' doctrine.",
      action: () => applyAISuggestion('hero-tagline', "A one-day reckoning where practitioners put real AI work on the table — what they tried, what broke, and what changed the math.")
    }
  ],
  scout: [
    {
      tag: "Speaker Bio", score: "GEN",
      content: "Drafted bio for Keynote 01: 'A category creator in AI-driven QE, specializing in autonomous test swarms and self-healing pipelines.'",
      action: () => console.log('Draft saved to clipboard.')
    }
  ],
  architect: [
    {
      tag: "Performance", score: "PASSED",
      content: "All LCP (Largest Contentful Paint) targets met. Ruflo-shield preloader verified at 100% efficiency.",
      action: null
    }
  ]
};

function runAgent(agentId) {
  const terminal = document.getElementById(`${agentId}-terminal`);
  if (!terminal) return;

  // 1. Simulate "Thinking"
  const lines = [
    `> Deploying ${agentId.toUpperCase()}_SWARM...`,
    `> Accessing AgentDB [HNSW-Index]...`,
    `> Reasoning through summit goals...`,
    `> Synthesizing optimal trajectories...`
  ];

  terminal.innerHTML = '';
  let i = 0;
  const interval = setInterval(() => {
    if (i < lines.length) {
      const div = document.createElement('div');
      div.className = 'terminal-line';
      div.textContent = lines[i];
      terminal.appendChild(div);
      i++;
    } else {
      clearInterval(interval);
      showInsights(agentId);
      const success = document.createElement('div');
      success.className = 'terminal-line success';
      success.textContent = `> SUCCESS: ${agentId.toUpperCase()}_ENGINE_SYNC_COMPLETE`;
      terminal.appendChild(success);
    }
  }, 600);
}

function showInsights(agentId) {
  const container = document.getElementById('ai-insights-container');
  if (!container) return;

  const data = AI_INSIGHTS[agentId];
  if (!data) return;

  if (container.querySelector('.insight-placeholder')) {
    container.innerHTML = '';
  }

  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'insight-item';
    div.innerHTML = `
      <div class="insight-header">
        <span class="insight-tag">${item.tag}</span>
        <span class="insight-score">${item.score}</span>
      </div>
      <div class="insight-content">${item.content}</div>
      <div class="insight-actions">
        ${item.action ? `<button class="btn-apply" onclick="(${item.action.toString()})()">APPLY TO SITE</button>` : ''}
        <button class="btn-apply" style="background:#333" onclick="this.parentElement.parentElement.remove()">DISMISS</button>
      </div>
    `;
    container.prepend(div);
  });
}

function applyAISuggestion(fieldId, value) {
  const input = document.getElementById(fieldId);
  if (input) {
    input.value = value;
    input.style.borderColor = 'var(--accent)';
    setTimeout(() => { input.style.borderColor = ''; }, 2000);
    if (typeof showSavedToast === 'function') showSavedToast('✨ AI Suggestion Applied (Click Sync to Live)');
  }
}

// Make globally accessible
window.runAgent = runAgent;
window.applyAISuggestion = applyAISuggestion;
