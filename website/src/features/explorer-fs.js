// Explorer file system/data model split from explorer.js
(function() {
  'use strict';

  var shared = window.Win95Shared || {};
  function file(name, opts) {
    return Object.assign({ type: 'file', name: name, size: '-', modified: '2026-03-31', icon: 'icon:file' }, opts || {});
  }

  function folder(name, children, opts) {
    return Object.assign({ type: 'folder', name: name, children: children || [] }, opts || {});
  }

  function cloneNode(node) {
    if (!node || typeof node !== 'object') return null;
    return Object.assign({}, node);
  }

  function fileShortcut(name, targetNode, opts) {
    return file(name, Object.assign({
      shortcut: {
        shortcutType: 'file',
        file: cloneNode(targetNode)
      }
    }, opts || {}));
  }

  function folderShortcut(name, targetPath, opts) {
    return folder(name, [], Object.assign({
      shortcut: {
        shortcutType: 'folder',
        targetPath: Array.isArray(targetPath) ? targetPath.slice() : []
      }
    }, opts || {}));
  }

  function buildNestedBackupFolders(totalDepth) {
    var depth = Math.max(1, Number(totalDepth) || 1);
    var node = file('PLEASE_STOP.txt', {
      size: '234 B',
      modified: '2026-03-31',
      icon: 'icon:help',
      content: [
        'congratulations.',
        'you found the innermost backup.',
        '',
        'there is nothing here.',
        'there was never anything here.',
        'i backed up an empty folder 17 times.',
        '',
        'i was very scared.',
        '',
        'the paper is fine.',
        'i think.',
        'i submitted something.',
        '',
        '— project author, 11:59 PM, march 31'
      ].join('\n')
    });
    var funnySuffixes = [
      'please_stop',
      'okay_but_why',
      'this_is_fine',
      'backup_goblin',
      'send_help',
      'last_one_i_swear',
      'the_folder_is_tired',
      'why_are_we_like_this',
      'no_more_backup',
      'end_of_the_line',
      'actually_final'
    ];

    function backupFolderName(level) {
      if (level <= 6) {
        return new Array(level).fill('backup').join('_');
      }
      var suffix = funnySuffixes[level - 7] || ('more_backup_' + (level - 6));
      return new Array(6).fill('backup').join('_') + '_' + suffix;
    }

    for (var i = depth; i >= 1; i--) {
      var name = backupFolderName(i);
      node = folder(name, [node]);
    }
    return node;
  }

  const IDS_SUPPLEMENTAL_FILES = [
    {
      name: 'presentation-mode.js',
      size: '88 KB',
      modified: '2026-04-01',
      path: './src/presentation/presentation-mode.js'
    },
    {
      name: 'reflection.txt',
      size: '4.2 KB',
      modified: '2026-03-31',
      path: './reflection.txt'
    }
  ];

  const FS = folder('C:', [
    folder('Desktop', [
      file('Research Paper.pdf', { size: '544 KB', url: './assets/docs/research-paper.pdf', icon: 'icon:paper' }),
      file('Presentation.exe', { size: '1 KB', content: 'Presentation.exe', icon: 'icon:presentation' }),
      file('Internet Explorer.exe', { size: '1 KB', content: 'Internet Explorer.exe', icon: 'icon:internet' }),
      file('Notepad.exe', { size: '1 KB', icon: 'icon:notepad' }),
      file('Terminal.exe', { size: '1 KB', icon: 'icon:terminal' }),
      file('Steam95.exe', { size: '1 KB', icon: 'icon:steam' }),
      file('Recycle Bin.exe', { size: '1 KB', icon: 'icon:recycle' }),
      folderShortcut('100% Homework', ['Documents', '100% Homework (seriously)'], {
        desktopId: 'desktop-homework-shortcut',
        modified: '2026-04-01',
        size: '-'
      }),
      fileShortcut('timeline.txt', {
        desktopId: 'desktop-timeline-shortcut',
        name: 'procrastination_timeline.txt',
        size: '3.3 KB',
        modified: '2026-04-01',
        content: [
          'TIMELINE.LOG',
          '',
          'Jan 15  assignment posted',
          'Feb 04  thought about it',
          'Mar 01  opened document, named it "paper", closed it',
          'Mar 25  watched Jensen Huang keynote for research purposes',
          'Mar 30  "tomorrow"',
          'Mar 31  wrote 13,455 words',
          'Apr 01  submitted',
          '',
          'no further notes'
        ].join('\n'),
        icon: 'icon:text'
      }, { modified: '2026-04-01', size: '3.3 KB' }),
      fileShortcut('mustwatch.mp4', {
        desktopId: 'desktop-mustwatch-shortcut',
        name: 'CPUvsGPUvsTPUvsDPUvsQPU.mp4',
        size: '2.7 MB',
        modified: '2026-04-01',
        url: './assets/media/videos/CPUvsGPUvsTPUvsDPUvsQPU.mp4',
        icon: 'icon:video'
      }, { modified: '2026-04-01', size: '2.7 MB' }),
      file('wallpaper-pixel.png', { size: '27 KB', url: './assets/media/photos/wallpaper-pixel.png', icon: 'icon:file' })
    ]),
    folder('Documents', [
      folder('100% Homework (seriously)', [
        file('ACTUAL_HOMEWORK_v1_FINAL_v2_ACTUALLY_FINAL.txt', {
          size: '4.2 KB',
          modified: '2026-03-31',
          content: [
            'CORNERSTONE — FINAL PAPER',
            'Author: Project Author',
            '',
            'ABSTRACT',
            'Artificial intelligence is changing the world.',
            'This paper will explain how.',
            '',
            'INTRODUCTION',
            'Artificial intelligence is changing the world.',
            '',
            '',
            '',
            '',
            '[file ends here]',
            'last modified: 11:58 PM'
          ].join('\n'),
          icon: 'icon:paper'
        }),
        file('chatgpt_audit_log.txt', {
          size: '2.1 KB',
          modified: '2026-03-30',
          content: [
            'AI CONTENT ANALYSIS',
            '───────────────────',
            'Human contribution:         detectable',
            'Bonzi Buddy contribution:   significant',
            'ChatGPT contribution:       plausible deniability',
            '',
            'The methodology section was written in one sitting.',
            'Do not look too closely at the methodology section.'
          ].join('\n'),
          icon: 'icon:document'
        }),
        file('clippy_suggestions.txt', {
          size: '1.8 KB',
          modified: '2026-03-29',
          content: [
            'CLIPPY.LOG',
            '',
            '[22:47] "It looks like you\'re writing a paper.',
            '         I\'ve deleted the introduction."',
            '[23:02] "Your argument is circular.',
            '         I\'ve made it more circular."',
            '[23:41] "You\'ve used \'paradigm\' 14 times.',
            '         Adding 3 more."',
            '[00:18] "Saved as ~WRD0003.tmp. You\'re welcome."',
            '[00:19] Clippy was removed from the system.',
            '[00:19] Clippy reinstalled itself.'
          ].join('\n'),
          icon: 'icon:help'
        }),
        file('procrastination_timeline.txt', {
          size: '3.3 KB',
          modified: '2026-04-01',
          content: [
            'TIMELINE.LOG',
            '',
            'Jan 15  assignment posted',
            'Feb 04  thought about it',
            'Mar 01  opened document, named it "paper", closed it',
            'Mar 25  watched Jensen Huang keynote for research purposes',
            'Mar 30  "tomorrow"',
            'Mar 31  wrote 13,455 words',
          'Apr 01  submitted',
          '',
          'no further notes'
        ].join('\n'),
          icon: 'icon:text'
        }),
        file('why_jensen_wears_leather.txt', {
          size: '1.1 KB',
          modified: '2026-03-25',
          content: [
            'RESEARCH MEMO',
            'RE: the leather jacket',
            '',
            'Spent 40 minutes on this. No conclusions.',
            '',
            'Leading theories:',
            '  1. cold',
            '  2. bit',
            '',
            'Not included in final paper.',
            '(It was included in the final paper.)'
          ].join('\n'),
          icon: 'icon:document'
        }),
        file('hinton_letter_draft.txt', {
          size: '0.9 KB',
          modified: '2026-03-28',
          content: [
            'Dr. Hinton —',
            '',
            'I cited you 14 times.',
            '',
            'When you said you regretted building AI,',
            'was that before or after I started this assignment.',
            '',
            'Respectfully,',
            'Project Author',
            '',
            '[draft — not sent]'
          ].join('\n'),
          icon: 'icon:paper'
        }),
        file('sources_ranked_by_credibility.txt', {
          size: '1.2 KB',
          modified: '2026-04-01',
          content: [
            'SOURCES RANKED BY CREDIBILITY',
            '────────────────────────────────────────',
            '1. Hinton et al., 2012        peer reviewed',
            '2. GTC 2024 keynote           leather jacket, still counts',
            '3. gpuwizard42, Reddit        unverified but compelling',
            '4. YouTube comment, 11 likes  primary source energy',
            '5. Bonzi, 3am                 personal communication'
          ].join('\n'),
          icon: 'icon:document'
        }),
        file('primary_source.mp4', {
          size: '2.7 MB',
          modified: '2026-04-01',
          url: './assets/media/videos/CPUvsGPUvsTPUvsDPUvsQPU.mp4',
          content: [
            'primary_source.mp4',
            'watched: 47 times',
            'citations extracted: 0'
          ].join('\n'),
          icon: 'icon:video'
        }),
        file('movie.mp4', {
          size: '2.7 MB',
          modified: '2026-04-01',
          url: './assets/media/videos/movie.mp4',
          icon: 'icon:video'
        }),
        file('IDS2891_survival_guide.txt', {
          size: '1.6 KB',
          modified: '2026-02-01',
          content: [
            'IDS2891 SURVIVAL GUIDE',
            '(week 1, no context)',
            '',
            '1. coffee: more than this',
            '2. Clippy will appear. do not engage.',
            '3. Bonzi is not a primary source.',
            '   (confirmed week 9)',
            '4. the terminal has a "panic" command.',
            '   it doesn\'t help but it\'s accurate.',
            '5. your research topic is whatever you',
            '   typed at 11:45 PM. that\'s the topic now.',
            '6. just submit something.'
          ].join('\n'),
          icon: 'icon:text'
        }),
        file('grade_calculator.csv', {
          size: '512 B',
          modified: '2026-04-01',
          content: [
            'Assignment,Points Possible,Points Earned,Notes',
            'Discussion Post 1,10,8,"Forgot to reply to two people"',
            'Interest Web,20,19,"actually did this one"',
            'Library 2,15,15,"the bibliography did most of the work"',
            'Crafting RQs,10,7,"RQ was just the assignment prompt rephrased"',
            'Check-in 1,20,18,"showed up, counts"',
            'Short Proposal,25,22,"wrote it on my phone"',
            'Check-in 2,20,19,"vibes"',
            'Check-in 3,20,20,"carried by presentation energy"',
            'Research Paper,100,?,""',
            'Final Presentation,100,?,""',
            '',
            '"?,?",current grade projection: probably fine',
            '"definitely fine",do NOT check canvas',
            '"do NOT",seriously do not open canvas right now'
          ].join('\n'),
          icon: 'icon:document'
        }),
        buildNestedBackupFolders(17)
      ]),
      folder('IDS2891', [], { dynamicDocs: true })
    ]),
    folder('Media', [
      folder('Audio', [
        file('00-default.mp3', { size: '9 KB', url: './assets/media/audio/00-default.mp3', icon: 'icon:audio' }),
        file('boot.mp3', { size: '59 KB', url: './assets/media/audio/boot.mp3', icon: 'icon:audio' }),
        file('startup-chime.mp3', { size: '9 KB', url: './assets/media/audio/startup-chime.mp3', icon: 'icon:audio' })
      ]),
      folder('Photos', [
        file('wallpaper-pixel.png', { size: '27 KB', url: './assets/media/photos/wallpaper-pixel.png', icon: 'icon:document' }),
        file('assignment-2-interest-web.png', { size: '123.9 KB', url: '../IDS2891/assignment-2-interest-web.png', icon: 'icon:document' }),
        file('bonzi-real-still.png', { size: '48 KB', url: './assets/media/photos/bonzi-real-still.png', icon: 'icon:document' }),
        file('clippy-real.png', { size: '11 KB', url: './assets/media/photos/clippy-real.png', icon: 'icon:document' }),
        folder('Bonzi', [
          file('bonzi-real-still.png', { size: '48 KB', url: './assets/media/photos/bonzi-real-still.png', icon: 'icon:document' }),
          file('bonzi-real.gif', { size: '195 KB', url: './assets/media/photos/bonzi-real.gif', icon: 'icon:document' }),
          folder('frames', [
            file('frame-00.png', { size: '47.2 KB', url: './assets/media/photos/bonzi-frames/frame-00.png', icon: 'icon:document' }),
            file('frame-01.png', { size: '46.0 KB', url: './assets/media/photos/bonzi-frames/frame-01.png', icon: 'icon:document' }),
            file('frame-02.png', { size: '47.2 KB', url: './assets/media/photos/bonzi-frames/frame-02.png', icon: 'icon:document' }),
            file('frame-03.png', { size: '46.9 KB', url: './assets/media/photos/bonzi-frames/frame-03.png', icon: 'icon:document' })
          ])
        ]),
        folder('Clippy', [
          file('clippy-real.png', { size: '11 KB', url: './assets/media/photos/clippy-real.png', icon: 'icon:document' }),
          file('clippy-body.png', { size: '2.8 KB', url: './assets/media/photos/clippy-body.png', icon: 'icon:document' }),
          folder('models', [
            file('rigged_microsoft_clippyclippit_fbx_and_blend.zip', { size: '124 KB', url: './assets/media/photos/clippy-models/rigged_microsoft_clippyclippit_fbx_and_blend.zip', icon: 'icon:file' })
          ])
        ]),
        folder('portraits', [
          file('altman.jpg', { size: '24.7 KB', url: './assets/media/photos/portraits/altman.jpg', icon: 'icon:document' }),
          file('amodei.jpg', { size: '21.0 KB', url: './assets/media/photos/portraits/amodei.jpg', icon: 'icon:document' }),
          file('feifei.jpg', { size: '24.6 KB', url: './assets/media/photos/portraits/feifei.jpg', icon: 'icon:document' }),
          file('hinton.jpg', { size: '14.6 KB', url: './assets/media/photos/portraits/hinton.jpg', icon: 'icon:document' }),
          file('jensen.jpg', { size: '22.3 KB', url: './assets/media/photos/portraits/jensen.jpg', icon: 'icon:document' }),
          file('karpathy.jpg', { size: '100.4 KB', url: './assets/media/photos/portraits/karpathy.jpg', icon: 'icon:document' }),
          file('keller.jpg', { size: '25.5 KB', url: './assets/media/photos/portraits/keller.jpg', icon: 'icon:document' }),
          file('lisasu.jpg', { size: '19.6 KB', url: './assets/media/photos/portraits/lisasu.jpg', icon: 'icon:document' }),
          file('moore.jpg', { size: '171.9 KB', url: './assets/media/photos/portraits/moore.jpg', icon: 'icon:document' })
        ])
      ]),
      folder('Videos', [
        file('CPUvsGPUvsTPUvsDPUvsQPU.mp4', { size: '2.7 MB', url: './assets/media/videos/CPUvsGPUvsTPUvsDPUvsQPU.mp4', icon: 'icon:video' }),
        file('movie.mp4', { size: '2.7 MB', url: './assets/media/videos/movie.mp4', icon: 'icon:video' })
      ])
    ]),
    folder('Website Source', [], { dynamicWebsite: true }),
    folder('System', [
      file('README.txt', {
        size: '1 KB',
        content: 'AI 98 OS Education Edition\nUser: Guest\n',
        icon: 'icon:text'
      }),
      file('grades.exe', { size: '1 KB', content: 'grades.exe', icon: 'icon:apps' }),
      file('bsod.exe', { size: '1 KB', content: 'bsod.exe', icon: 'icon:apps' })
    ])
  ]);

  function fallbackGetExt(name) {
    if (!name || name.indexOf('.') === -1) return '';
    return name.split('.').pop().toLowerCase();
  }

  function fileTypeLabel(node) {
    if (typeof shared.fileTypeLabel === 'function') return shared.fileTypeLabel(node);
    if (!node) return '';
    if (node.type === 'folder') return 'File Folder';
    const ext = fallbackGetExt(node.name);
    if (ext === 'txt') return 'Text Document';
    if (ext === 'md') return 'Markdown Document';
    if (ext === 'pdf') return 'PDF Document';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'Image File';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'Audio File';
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'Video File';
    if (ext === 'exe') return 'Application';
    if (ext === 'csv') return 'CSV Document';
    if (ext === 'lnk') return 'Shortcut';
    return ext ? ext.toUpperCase() + ' File' : 'File';
  }

  function fileIcon(node) {
    if (typeof shared.fileIcon === 'function') return shared.fileIcon(node);
    if (!node) return 'icon:file';
    if (node.type === 'folder') return 'icon:folderClosed';
    const ext = fallbackGetExt(node.name);
    if (ext === 'txt') return 'icon:text';
    if (ext === 'md') return 'icon:text';
    if (ext === 'pdf') return 'icon:document';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'icon:document';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'icon:audio';
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'icon:video';
    if (ext === 'js') return 'icon:file';
    if (ext === 'css') return 'icon:file';
    if (ext === 'json') return 'icon:file';
    if (ext === 'lnk') return 'icon:file';
    if (ext === 'exe') return 'icon:apps';
    if (ext === 'csv') return 'icon:file';
    return 'icon:file';
  }

  function pathString(pathParts) {
    return 'C:\\' + pathParts.join('\\');
  }

  window.ExplorerData = {
    IDS_SUPPLEMENTAL_FILES: IDS_SUPPLEMENTAL_FILES,
    FS: FS,
    fileTypeLabel: fileTypeLabel,
    fileIcon: fileIcon,
    pathString: pathString,
    shared: shared
  };
})();
