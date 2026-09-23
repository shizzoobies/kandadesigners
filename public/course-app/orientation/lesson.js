window.LESSON = {
  title: 'Before your first build',
  subtitle: 'A beginner orientation to working with Claude Code',
  voice: { id: 'qSeXEcewz7tA0Q0qk9fH', model: 'eleven_multilingual_v2', name: 'Victoria' },
  sources: [
    ['Claude Code overview', 'https://code.claude.com/docs/en/overview'],
    ['Terminal guide for new users', 'https://code.claude.com/docs/en/terminal-guide'],
    ['Claude Code quickstart and account options', 'https://code.claude.com/docs/en/quickstart'],
    ['Official troubleshooting', 'https://code.claude.com/docs/en/troubleshooting']
  ],
  chapters: [
    {
      id: 'welcome', short: 'What you are learning', phase: 'A PLACE TO START',
      title: 'You can start before you know how to code.',
      intro: 'Get familiar with the tools and practice a small task. This orientation runs entirely in your browser.',
      takeaway: 'You describe a result. Claude can help change the files. You check what happened.',
      action: 'For the real follow-along, use a laptop or desktop and a practice folder. You can complete this orientation without a Claude account.',
      prompt: 'Explain this project in everyday language. What will I see when I open it? Do not change any files yet.',
      narration: 'Welcome. If you have never written code, start here. Code is a set of instructions that tells a computer what to do. A website keeps those instructions in files. You do not have to write them yourself to begin this lesson. Claude Code can help read and change a project. You describe the result you want, and you check the result it produces. In an ordinary chat, you might ask for advice and receive an explanation. Here, you will eventually let Claude work on files in a folder you choose. This orientation is a rehearsal. The practice screens are illustrations, not a live Claude session. Nothing here installs software or changes your computer. Our small goal is to change a reading list heading and see that change on the page. No jargon to memorize. No race to finish. After this orientation, the next lesson walks through installation and a fuller project. Using Claude Code for real requires supported account access; this free lesson does not include that access.'
    },
    {
      id: 'windows', short: 'Know your windows', phase: 'WHERE THINGS HAPPEN',
      title: 'Three windows. Three different jobs.',
      intro: 'You will move between your browser, your file manager, and a terminal. They each have a different purpose.',
      takeaway: 'Find files in your file manager. Give instructions in the terminal. See the page in your browser.',
      action: 'Keep this lesson in one browser tab. Open the practice page in another so you can return here whenever you need to.',
      prompt: 'I am new to this. Tell me which window I should use for each action, and what I should expect to see.',
      narration: 'Let us name the windows before we move between them. Your browser is the app showing this lesson, such as Chrome, Edge, or Safari. Later, it also shows the page you are working on. A browser tab is one page inside that window. Your file manager shows the files on your computer. On Windows it is called File Explorer. On a Mac it is called Finder. Use it to find your downloaded practice project. The terminal is a window where you type instructions instead of clicking through menus. This learning path uses Claude Code in the terminal. Claude Code has other interfaces too, but we will stick with this one so the next lesson feels familiar. On Windows, our examples use PowerShell. On a Mac, they use Terminal. You do not need to understand everything already written in that window. The practice asks you to choose the right window for a few everyday actions. Finding a file, asking Claude for a change, and looking at the result are different jobs. Knowing where each job happens removes a lot of confusion.'
    },
    {
      id: 'folder', short: 'Meet your practice folder', phase: 'FILES WITHOUT THE MYSTERY',
      title: 'A project is a folder with a purpose.',
      intro: 'Our project is a small reading-list page. Its files belong together, so keep them in the same folder.',
      takeaway: 'Extract the ZIP, open the resulting folder, then open index.html to see the practice page.',
      action: 'Download the starter from this panel. In Windows, right-click the ZIP and choose Extract All. On a Mac, double-click the ZIP. Open the resulting reading-list-starter folder, then double-click index.html. If it opens in an editor, use Open with and choose your browser.',
      prompt: 'Look at the files in this practice folder. Explain what each one does in a short sentence. Do not edit them.',
      narration: 'A file holds information. A folder keeps related files together. When we say project, we mean the folder of files we are working on. Our download is a ZIP file, which is a package containing those files. Extract means unpack that package into a normal folder. On Windows, right-click the ZIP and choose Extract All. On a Mac, double-click the ZIP. Then open the resulting reading list starter folder. Work in that extracted folder, not the compressed ZIP. Inside, index dot html is the page to open in your browser. Styles dot c s s describes how the page looks. App dot j s contains its behavior. The readme is a short note about the project. These names are labels to recognize, not a spelling test. Double-click index dot html to see the reading list. If an editor opens instead, use Open with and choose your browser. Opening the page this way does not publish it online. You are viewing a file on your own computer. The practice lets you rehearse unpacking and opening it before you try the real download.'
    },
    {
      id: 'terminal', short: 'Get comfortable typing commands', phase: 'A WINDOW YOU CAN UNDERSTAND',
      title: 'Tell the terminal which folder to use.',
      intro: 'A command is a short instruction to the computer. A folder path is the address of a folder.',
      takeaway: 'First choose the project folder with cd. After installation, claude starts the coding assistant there.',
      action: 'Choose Windows or Mac below. This is practice with an example address. On your own computer, use the location of your extracted folder. Installation and sign-in are covered in the next lesson.',
      prompt: 'I am at this point in the setup: [describe the window and copy the exact error, if there is one]. Explain the next action in plain language.',
      narration: 'The terminal may look unfamiliar, but we only need two ideas for now. A folder path is an address that tells the computer where a folder lives. The letters c d mean change directory. Directory is another word for folder. Type c d, a space, and the folder address in quotes, then press Enter. The quotes keep an address with spaces together. In this practice, use the example address shown on screen. On your computer, the address will be different. You can see the current folder in the example prompt after the command runs. A prompt is the place where the terminal waits for your next instruction. After Claude Code is installed, typing claude and pressing Enter starts it in the current folder. The first launch may open a browser for sign-in and ask about trusting the project. The next lesson covers that setup. Once Claude is ready, you can write an ordinary sentence describing what you want. A setup command goes to the computer. Your request goes to Claude. If something fails, stop and read the message. Copy the exact error when asking for help; do not keep pasting commands you do not understand.'
    },
    {
      id: 'request', short: 'Ask, review, and look', phase: 'YOUR FIRST SMALL SUCCESS',
      title: 'Ask for a change you can see.',
      intro: 'We will rehearse changing one heading from “Weekend reading” to “My reading list”. You do not need to read code to check that result.',
      takeaway: 'Name the change, keep the scope small, and look at the result yourself.',
      action: 'In a real session, read the proposed action before approving it. If it goes beyond your request, ask Claude to explain or narrow it. After a change, return to your browser and refresh the practice page.',
      prompt: 'Change the heading from "Weekend reading" to "My reading list". Keep the books and design the same. Explain which file you would change before editing.',
      narration: 'Here is a request you can check without knowing any code. Change the heading from Weekend reading to My reading list. Keep the books and design the same. Explain which file you would change before editing. That gives Claude a small task and tells it what to leave alone. Read the proposed action. In our example, it is one heading in index dot html. A permission request asks whether an action may go ahead. The real wording depends on your settings, so do not memorize a button position. Check that the action matches your request. If you are unsure, ask for an explanation. A heading change does not call for deleting the project or publishing a website. In the practice, approve the small edit, then open the browser preview and refresh it. You should see My reading list above the same books. That visible comparison is your check. If the heading has not changed, or something else looks different, tell Claude exactly what you see. You remain part of the process. A message saying done is an invitation to look, not proof that everything worked.'
    },
    {
      id: 'ready', short: 'Move into the next lesson', phase: 'READY FOR THE NEXT SMALL STEP',
      title: 'You know where to begin.',
      intro: 'You have rehearsed the basic actions. The next lesson takes you through the real setup and a more useful change.',
      takeaway: 'You do not need every technical term. You need a clear request and a way to check it.',
      action: 'Use a laptop or desktop for the follow-along. Have the extracted starter folder ready. Check the official account options before installing. Keep this orientation open if you want to revisit anything.',
      prompt: 'Please guide me one action at a time. Explain unfamiliar words when you use them. Tell me which window to use and what I should see before we continue.',
      narration: 'Before moving on, check what feels familiar. Can you tell the browser, file manager, and terminal apart? Do you know why the project should be an extracted folder? Can you describe a small change and say what success would look like? If one part still feels unclear, revisit it. Completing a practice screen does not mean Claude Code is installed on your computer, and it does not make you a programmer overnight. It means the next instructions now have somewhere to land. For the real lesson, use a laptop or desktop and have supported Claude Code account access. Check the official account options linked in this lesson. Keep the practice project separate from files you care about. The next lesson is called Your first session. Start at its beginning to learn the workflow, or choose Open your first project when you are ready for installation. You will hear more technical words there. Ask for plain-language explanations and take one action at a time. The habit is simple: say what you want, understand the proposed action, and look at the result. That is enough to take the next small step.'
    }
  ]
};
