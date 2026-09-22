window.LESSON = {
  title: 'Your first session with Claude Code',
  revised: '2026-09-22',
  voice: { id: 'qSeXEcewz7tA0Q0qk9fH', name: 'Victoria', model: 'eleven_multilingual_v2' },
  chapters: [
    {
      id: 'direction', phase: 'THE MINDSET', short: 'You set the direction', title: 'A clear brief.\nA better first build.',
      intro: 'Learn the workflow by making one useful change: turn a static reading list into a working checklist.',
      takeaway: 'Describe the outcome, set the boundaries, decide how to check it.',
      points: ['A real project folder', 'One small, visible change', 'A result you can check'],
      narration: 'Welcome to your first session with Claude Code, from K and A Performance. By the end, you will know how to open a project, give Claude a useful brief, review a change, and check the result yourself. Our practice project is a small reading list. We will ask Claude to make its checkboxes work and remember their state after a refresh. Claude Code can read files, edit code, and run tools inside a project. That makes your instructions important. Start with an outcome, a boundary, and a way to verify success. For example: make the reading checklist remember my choices. Keep the existing design. Check that the choices survive a refresh. You do not need to memorize every command before you begin. You need a small task and a clear definition of done. In the interactive lesson, the practice terminal is a simulation. It does not run commands on your computer or send anything to Claude. Use it to rehearse, then try the same workflow in your own project.',
      prompt: 'Make this reading checklist remember my choices after a refresh. Keep the existing design. First inspect the files and propose a small plan. Do not edit yet.',
      exercise: { type: 'brief', title: 'Give Claude a useful brief', question: 'Which request gives you a result you can actually verify?', choices: ['Make this app better. Use your best judgment.', 'Remember checked books after a refresh. Keep the design. Inspect and plan before editing.', 'Rebuild everything with the newest framework.'], answer: 1, success: 'Exactly. A specific outcome, a boundary, and a check make the work reviewable.', retry: 'Look for a visible result, something to preserve, and a way to check success.' },
      action: 'Download the starter ZIP using the lesson link. Extract it, then open index.html to see the reading list before making changes.'
    },
    {
      id: 'setup', phase: 'SETUP & MAPPING', short: 'Open your first project', title: 'Start in the\nright place.',
      intro: 'Install the terminal version, sign in, and launch Claude from the extracted practice folder.',
      takeaway: 'Your terminal location tells Claude which project you are working on.',
      points: ['Choose your operating system', 'Open the practice folder', 'Launch and sign in'],
      narration: 'Let us get the terminal version ready. A terminal is simply an app where you type commands. On Windows, open PowerShell. On a Mac, open Terminal. Choose your operating system in the lesson and use the linked official installation instructions. The Windows PowerShell installer and the Mac or Linux shell installer are shown on screen. These commands download and run the official installer, so check the address before you use them. After installation, open a new terminal and run claude, followed by two hyphens and version, to check that it is available. You will need access through an eligible Claude account or another supported authentication option. Follow the sign-in prompts on first launch. For a subscription account, choose the Claude sign-in option. API billing is separate. Now extract the starter ZIP. In your terminal, type c d, a space, and the path to that extracted folder. Put the path in quotes if it contains spaces. Run claude from inside that folder. Read the project trust prompt and continue only for a folder you recognize. If the command is not found, reopen the terminal and use the installation troubleshooting link. There is no need to change your entire computer setup just to complete this lesson.',
      prompt: 'claude --version',
      exercise: { type: 'terminal', title: 'Rehearse the first launch', question: 'You are already in the extracted reading-list-starter folder. Enter the command that starts Claude Code.', expected: 'claude', success: 'Practice session started. In the real terminal, follow the sign-in and project trust prompts.', retry: 'The launch command is just: claude' },
      action: 'In your real terminal, enter the extracted starter folder and run claude. The practice terminal cannot install or launch software.'
    },
    {
      id: 'map', phase: 'SETUP & MAPPING', short: 'Map before you change', title: 'Let Claude look\nbefore it builds.',
      intro: 'Ask for a short tour of the relevant files. Then record only the project instructions that matter.',
      takeaway: 'CLAUDE.md holds your project guidance. Review what goes into it.',
      points: ['Read the relevant files', 'Identify the current behavior', 'Review project instructions'],
      narration: 'Before asking Claude to edit, ask it to explain the project. Our starter contains a web page, a stylesheet, a JavaScript file, and a short readme. Ask which file controls the checkboxes and why selections disappear after a refresh. Keep the exploration focused on this task. For an unfamiliar project, slash init can help draft a CLAUDE dot M D instruction file. Review the draft and correct anything it inferred incorrectly. The file is guidance, not an enforced security boundary. For this exercise, useful instructions are simple: preserve the visual design, use the existing plain JavaScript, and check the reading list in a browser. A short, accurate file is more useful than a long set of generic rules. Claude also has automatic memory for learned patterns. That serves a different purpose from the project rules you maintain. You do not need to configure an elaborate memory system today. Start by understanding the files and making your expectations explicit. If the project already has instructions, read those first and avoid replacing them with a generic template.',
      prompt: 'Inspect README.md, index.html, styles.css, and app.js. Explain how the reading list works and why choices reset. Identify the smallest change needed. Do not edit files yet.',
      exercise: { type: 'choice', title: 'Keep the useful instruction', question: 'What belongs in this practice project\'s CLAUDE.md?', choices: ['Always be a world-class developer.', 'Preserve styles.css. Use plain JavaScript. Verify checked books persist after reload.', 'Copy every source file into the instruction file.'], answer: 1, success: 'Specific project guidance helps Claude make the right change and check it.', retry: 'Choose the instruction that names the actual project constraints and verification.' },
      action: 'Ask Claude for the short project tour. If you use /init, review its proposed instructions before keeping them.'
    },
    {
      id: 'plan', phase: 'CONTROLLED EXECUTION', short: 'Make a small plan', title: 'Agree on the work.\nThen let it work.',
      intro: 'Separate exploration from editing. A good plan names the files, the change, and the checks.',
      takeaway: 'Use Plan mode to work through the approach before implementation.',
      points: ['Explore', 'Plan', 'Implement', 'Verify'],
      narration: 'Now we turn the request into a small plan. In the terminal, Shift plus Tab cycles through permission modes. Stop when the interface shows Plan mode. Confirm the displayed mode instead of assuming one key press always lands in the right place. Ask Claude to propose how it will save checked book identifiers and restore them on page load. A sensible plan for our project changes the JavaScript, keeps the layout, and checks both selecting and clearing a book. Read the plan. If it adds a database, a new framework, or a sign-in system, bring it back to the small task. Browser storage is enough for this practice example. Once the plan matches your goal, leave Plan mode and ask Claude to implement it. Read permission requests as they appear. A request to edit the expected project file is different from a request to publish a site or delete a folder. If the scope is unclear, stop and ask for an explanation. The useful habit is simple: explore, plan, implement, verify. Planning is especially helpful when you are new or the change has several moving parts.',
      prompt: 'In Plan mode, propose the smallest change to persist checked book IDs in localStorage and restore them on page load. Preserve the design. Include checks for selecting, clearing, and refreshing. Do not implement yet.',
      exercise: { type: 'choice', title: 'Review the proposed scope', question: 'Claude proposes changing app.js and adding a paid database. What do you do?', choices: ['Approve the whole plan to keep things moving.', 'Ask for localStorage in app.js only. This practice task needs no account or database.', 'Give permission to change any project on the computer.'], answer: 1, success: 'Good scope control. Keep the solution proportional to the task.', retry: 'The task is local persistence in a tiny browser project. Which response keeps that scope?' },
      action: 'Review the plan. Then leave Plan mode and say: Implement that plan in app.js. Keep the existing design and explain the changes.'
    },
    {
      id: 'verify', phase: 'CONTROLLED EXECUTION', short: 'Check the result', title: '“Done” needs\nevidence.',
      intro: 'Read the changed code and exercise the behavior. A confident summary is a starting point for review.',
      takeaway: 'A passing check only proves the behavior that check actually covers.',
      points: ['Check a book', 'Refresh the page', 'Clear it and refresh again'],
      narration: 'Claude says the change is complete. Now check it. Ask which files changed, what the checks showed, and what it could not verify. Review the code changes in your editor, or use git diff if your project is already tracked in Git. Our practice project does not require Git or a build system. Open its index file in a browser. Check the first book, refresh, and confirm it remains checked. Uncheck it, refresh again, and confirm it stays cleared. Check a different book to make sure the items are independent. Watch the browser console for errors. If your browser restricts storage for local files, ask Claude to serve this folder locally and use that address consistently. On an existing application, use its actual build and test commands. Do not invent an npm test command when the project has no test script. If a check fails, give Claude the exact observed behavior and any relevant error text. Keep secrets out of pasted logs. Ask for a focused fix, then repeat the affected checks. Tests, browser checks, and your review work together. They do not guarantee that every possible bug is gone, but they give you evidence about the change you asked for.',
      prompt: 'Summarize the exact files changed and checks run. State anything you could not verify. I will test selecting a book, reloading, clearing it, and reloading again.',
      exercise: { type: 'checklist', title: 'Run a simulated verification', question: 'Check a book, reload the preview, then clear it and reload again.', success: 'Both directions passed in the practice preview. Repeat these checks on the project Claude actually changed.' },
      action: 'Run these checks in the real starter project. The practice preview demonstrates the expected behavior; it does not verify Claude\'s output.'
    },
    {
      id: 'context', phase: 'CONTEXT MAINTENANCE', short: 'Keep the session focused', title: 'Keep what matters.\nLeave the noise.',
      intro: 'Use a compact handoff when work gets long. Start a fresh conversation when the task changes.',
      takeaway: 'Manage context around the task, without chasing a magic percentage.',
      points: ['/context: inspect usage', '/compact: summarize', '/clear: start fresh'],
      narration: 'As you work, the conversation fills with instructions, file contents, and tool results. That is context. Keep requests focused and avoid dumping unrelated files into the session. Slash context helps you inspect usage. Slash compact summarizes a long conversation, and you can tell it which decisions and checks to preserve. When you move to an unrelated task, slash clear starts a fresh conversation. Save any important decisions first. Project instructions are still available when the new conversation begins. There is no universal forty percent target that guarantees better results. The practical question is whether the session still has the information needed for the current task. If Claude starts repeating an unsuccessful approach, stop, explain the mismatch, and narrow the next step. Slash rewind can restore supported conversation or file checkpoints, but it is not a general undo button. It cannot undo every shell command or an external action, such as a published deployment. Keep normal backups and use Git when it fits your project. Before ending today, ask Claude for a short handoff: what changed, what passed, and what remains. That gives your next session somewhere sensible to begin.',
      prompt: '/compact Preserve the reading-list goal, changed files, verification results, and any unfinished work.',
      exercise: { type: 'choice', title: 'Choose the right reset', question: 'You finished the checklist and are switching to an unrelated project task. What helps?', choices: ['Paste all project files into the current conversation.', 'Save a short handoff, then use /clear for the new task.', 'Use /rewind to undo a production deployment.'], answer: 1, success: 'A saved handoff preserves decisions while a fresh conversation keeps the next task focused.', retry: 'Think about preserving useful decisions without carrying an unrelated conversation forward.' },
      action: 'Ask for a short handoff with changed files, checks, and unfinished work. Save it before clearing the conversation.'
    },
    {
      id: 'next', phase: 'REPEATABLE WORKFLOWS', short: 'Make the workflow yours', title: 'One good session.\nA repeatable habit.',
      intro: 'Build confidence with the small loop first. Add reusable workflows when you have a real reason.',
      takeaway: 'Define it. Bound it. Build it. Check it.',
      points: ['Skills: reusable instructions', 'Subagents: focused delegation', 'MCP: connected tools'],
      narration: 'You now have the core workflow. Define the result, inspect the project, review a plan, implement a small change, and verify it. When you repeat a useful procedure, a skill can package the instructions in a SKILL dot M D file. Full skill instructions load when used, though the skill listing itself can still consume context. Subagents can investigate a focused question in a separate context and return a summary. They are useful for independent work, but every task does not need a team. M C P connects Claude to external tools and data. Those connections bring their own permissions and responsibilities, so add them for a specific need. None of these extensions is required for your first successful session. Your next exercise is deliberately small: ask Claude to show how many books remain unread, preserve the design, and verify that the count changes when you select and clear books. Use the prompt builder to create a brief for your own project. Then take the same habits with you: a clear outcome, a sensible boundary, and evidence that the result works. That is a first session worth repeating.',
      prompt: 'Add an unread-book count. Preserve the design and use the existing JavaScript. Plan first. Verify the count on load, after checking a book, and after clearing it.',
      exercise: { type: 'builder', title: 'Write your next brief', question: 'Turn your own idea into a task Claude can check.', success: 'Your brief is ready to copy into Claude Code.' },
      action: 'Download your session notes and use your next brief in a real project. Start with one small change.'
    }
  ],
  sources: [
    ['Install and get started', 'https://code.claude.com/docs/en/overview'],
    ['First session', 'https://code.claude.com/docs/en/quickstart'],
    ['Project instructions and memory', 'https://code.claude.com/docs/en/memory'],
    ['Working practices', 'https://code.claude.com/docs/en/best-practices'],
    ['Checkpoint limitations', 'https://code.claude.com/docs/en/checkpointing'],
    ['Skills', 'https://code.claude.com/docs/en/skills'],
    ['Installation troubleshooting', 'https://code.claude.com/docs/en/troubleshooting']
  ]
};
