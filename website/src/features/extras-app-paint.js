// Win95 extras: Paint app
(function() {
  'use strict';

  var PAINT_DOCS_KEY = 'win95-paint-docs-v1';

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function createDefaultDoc() {
    return {
      id: 'default-gpu-diagram',
      name: 'GPU Diagram.paint',
      template: 'gpu',
      imageDataUrl: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      locked: true
    };
  }

  function loadPaintDocs() {
    var docs = readJSON(PAINT_DOCS_KEY, []);
    if (!Array.isArray(docs)) docs = [];
    docs = docs.filter(function(doc) {
      return doc && typeof doc === 'object' && typeof doc.name === 'string';
    });

    var defaultIdx = docs.findIndex(function(doc) { return doc.id === 'default-gpu-diagram'; });
    if (defaultIdx === -1) {
      docs.unshift(createDefaultDoc());
    } else {
      docs[defaultIdx] = Object.assign(createDefaultDoc(), docs[defaultIdx], {
        id: 'default-gpu-diagram',
        name: 'GPU Diagram.paint',
        template: 'gpu',
        locked: true
      });
    }

    docs.forEach(function(doc, idx) {
      if (!doc.id) doc.id = 'paint-doc-' + idx + '-' + Date.now();
      if (typeof doc.template !== 'string') doc.template = '';
      if (typeof doc.imageDataUrl !== 'string') doc.imageDataUrl = '';
    });

    return docs;
  }

  function savePaintDocs(docs) {
    writeJSON(PAINT_DOCS_KEY, docs || []);
  }

  function formatTimestamp() {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var ss = String(d.getSeconds()).padStart(2, '0');
    return hh + '-' + mm + '-' + ss;
  }

  function clearCanvas(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  function clampByte(value) {
    return Math.max(0, Math.min(255, value | 0));
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(n) {
      return clampByte(n).toString(16).padStart(2, '0');
    }).join('');
  }

  function getCanvasColor(ctx, canvas, x, y) {
    var px = Math.max(0, Math.min(canvas.width - 1, x));
    var py = Math.max(0, Math.min(canvas.height - 1, y));
    var data = ctx.getImageData(px, py, 1, 1).data;
    return rgbToHex(data[0], data[1], data[2]);
  }

  function createPaint() {
    var wrap = document.createElement('div');
    wrap.className = 'paint-app';

    var toolbar = document.createElement('div');
    toolbar.className = 'paint-toolbar';

    var docs = loadPaintDocs();
    var currentDocIndex = 0;
    var autoSaveTimer = 0;

    var fileControls = document.createElement('div');
    fileControls.className = 'paint-file-controls';

    var fileSelect = document.createElement('select');
    fileSelect.className = 'paint-file-select';

    var newBtn = document.createElement('button');
    newBtn.type = 'button';
    newBtn.className = 'paint-file-btn';
    newBtn.textContent = 'New Blank';

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'paint-file-btn';
    saveBtn.textContent = 'Save';

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'paint-file-btn';
    clearBtn.textContent = 'Clear';

    var undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'paint-file-btn';
    undoBtn.textContent = 'Undo';

    fileControls.appendChild(fileSelect);
    fileControls.appendChild(newBtn);
    fileControls.appendChild(saveBtn);
    fileControls.appendChild(clearBtn);
    fileControls.appendChild(undoBtn);
    toolbar.appendChild(fileControls);

    var toolDefs = [
      { id: 'pencil', title: 'Pencil', glyph: '✎' },
      { id: 'eraser', title: 'Eraser', glyph: '⌫' },
      { id: 'fill', title: 'Fill', glyph: '🪣' },
      { id: 'line', title: 'Line', glyph: '╱' },
      { id: 'rect', title: 'Rectangle', glyph: '▭' },
      { id: 'ellipse', title: 'Ellipse', glyph: '◯' },
      { id: 'picker', title: 'Color Picker', glyph: '⌖' }
    ];
    var currentTool = 'pencil';
    var currentColor = '#000000';
    var currentShape = null;

    function setTool(nextTool) {
      currentTool = nextTool;
      toolbar.querySelectorAll('.paint-tool').forEach(function(b) {
        b.classList.toggle('active', b.dataset.tool === nextTool);
      });
      setStatus('Tool set to ' + nextTool + '.');
    }

    toolDefs.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'paint-tool' + (t.id === 'pencil' ? ' active' : '');
      btn.title = t.title;
      btn.type = 'button';
      btn.dataset.tool = t.id;
      if (window.Win95Shared && typeof window.Win95Shared.renderIcon === 'function' && t.id === 'pencil') {
        var icon = document.createElement('span');
        icon.className = 'paint-tool-icon';
        window.Win95Shared.renderIcon(icon, 'icon:paint', { alt: t.title });
        btn.appendChild(icon);
      } else if (window.Win95Shared && typeof window.Win95Shared.renderIcon === 'function' && t.id === 'picker') {
        var pickerIcon = document.createElement('span');
        pickerIcon.className = 'paint-tool-icon';
        window.Win95Shared.renderIcon(pickerIcon, 'icon:search', { alt: t.title });
        btn.appendChild(pickerIcon);
      } else if (window.Win95Shared && typeof window.Win95Shared.renderIcon === 'function' && t.id === 'fill') {
        var fillIcon = document.createElement('span');
        fillIcon.className = 'paint-tool-icon';
        fillIcon.textContent = '🪣';
        btn.appendChild(fillIcon);
      } else {
        btn.textContent = t.glyph;
      }
      btn.addEventListener('click', function() {
        setTool(t.id);
      });
      toolbar.appendChild(btn);
    });

    var palette = document.createElement('div');
    palette.className = 'paint-palette';
    var colors = [
      '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
      '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'
    ];
    colors.forEach(function(c) {
      var swatch = document.createElement('div');
      swatch.className = 'paint-swatch' + (c === '#000000' ? ' active' : '');
      swatch.style.background = c;
      swatch.dataset.color = c;
      swatch.addEventListener('click', function() {
        palette.querySelectorAll('.paint-swatch').forEach(function(s) { s.classList.remove('active'); });
        swatch.classList.add('active');
        currentColor = c;
      });
      palette.appendChild(swatch);
    });
    toolbar.appendChild(palette);

    var sizeLabel = document.createElement('span');
    sizeLabel.className = 'paint-size-label';
    sizeLabel.textContent = 'Size';
    var sizeRow = document.createElement('div');
    sizeRow.className = 'paint-size-row';
    sizeRow.appendChild(sizeLabel);
    var sizeButtons = [];
    [1, 2, 4, 8, 12].forEach(function(px) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'paint-size-chip' + (px === 2 ? ' active' : '');
      btn.textContent = String(px) + 'px';
      btn.dataset.size = String(px);
      btn.addEventListener('click', function() {
        brushSize = px;
        sizeButtons.forEach(function(nextBtn) {
          nextBtn.classList.toggle('active', nextBtn === btn);
        });
        setStatus('Brush size set to ' + brushSize + 'px.');
      });
      sizeButtons.push(btn);
      sizeRow.appendChild(btn);
    });
    toolbar.appendChild(sizeRow);

    wrap.appendChild(toolbar);

    var canvasWrap = document.createElement('div');
    canvasWrap.className = 'paint-canvas-wrap';
    var canvas = document.createElement('canvas');
    canvas.width = 860;
    canvas.height = 520;
    canvas.className = 'paint-canvas';
    canvasWrap.appendChild(canvas);
    var previewCanvas = document.createElement('canvas');
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    previewCanvas.className = 'paint-preview-canvas';
    canvasWrap.appendChild(previewCanvas);
    wrap.appendChild(canvasWrap);

    var statusBar = document.createElement('div');
    statusBar.className = 'paint-status';
    statusBar.textContent = 'Ready.';
    wrap.appendChild(statusBar);

    var ctx = canvas.getContext('2d');
    var previewCtx = previewCanvas.getContext('2d');
    var brushSize = 2;
    var undoStack = [];
    var maxUndo = 20;
    var toolbarObserver = null;

    function setStatus(text) {
      statusBar.textContent = text;
    }

    function snapshot() {
      try {
        undoStack.push(canvas.toDataURL('image/png'));
        if (undoStack.length > maxUndo) undoStack.shift();
      } catch (e) {}
    }

    function restore(dataUrl) {
      if (!dataUrl) return;
      var img = new Image();
      img.onload = function() {
        clearCanvas(ctx, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        queueAutosave();
        setStatus('Undo complete.');
      };
      img.src = dataUrl;
    }

    function getStrokeWidth() {
      if (currentTool === 'eraser') return Math.max(8, brushSize * 4);
      return brushSize;
    }

    function drawShapePreview(fromX, fromY, toX, toY) {
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewCtx.save();
      previewCtx.strokeStyle = currentColor;
      previewCtx.fillStyle = currentColor;
      previewCtx.lineWidth = brushSize;
      previewCtx.lineJoin = 'round';
      previewCtx.lineCap = 'round';
      if (currentTool === 'line') {
        previewCtx.beginPath();
        previewCtx.moveTo(fromX, fromY);
        previewCtx.lineTo(toX, toY);
        previewCtx.stroke();
      } else if (currentTool === 'rect') {
        var left = Math.min(fromX, toX);
        var top = Math.min(fromY, toY);
        var width = Math.max(1, Math.abs(toX - fromX));
        var height = Math.max(1, Math.abs(toY - fromY));
        previewCtx.strokeRect(left, top, width, height);
      } else if (currentTool === 'ellipse') {
        var cx = (fromX + toX) / 2;
        var cy = (fromY + toY) / 2;
        var rx = Math.abs(toX - fromX) / 2;
        var ry = Math.abs(toY - fromY) / 2;
        previewCtx.beginPath();
        previewCtx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        previewCtx.stroke();
      }
      previewCtx.restore();
    }

    function commitShape() {
      if (!currentShape) return;
      ctx.drawImage(previewCanvas, 0, 0);
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      currentShape = null;
      queueAutosave();
    }

    function updateToolbarLayout() {
      var compact = wrap.clientWidth >= 1000;
      toolbar.classList.toggle('paint-toolbar--compact', compact);
    }

    function currentDoc() {
      return docs[currentDocIndex] || null;
    }

    function renderFileSelect() {
      fileSelect.textContent = '';
      docs.forEach(function(doc, idx) {
        var opt = document.createElement('option');
        opt.value = String(idx);
        opt.textContent = doc.name;
        fileSelect.appendChild(opt);
      });
      fileSelect.value = String(currentDocIndex);
    }

    function loadDocIntoCanvas(doc) {
      if (!doc) return;
      if (doc.id === 'default-gpu-diagram') {
        drawGPUDiagram(ctx, canvas.width, canvas.height);
        setStatus('Opened ' + doc.name + '.');
        return;
      }
      if (doc.imageDataUrl) {
        var img = new Image();
        img.onload = function() {
          clearCanvas(ctx, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setStatus('Opened ' + doc.name + '.');
        };
        img.onerror = function() {
          clearCanvas(ctx, canvas.width, canvas.height);
          setStatus('Opened ' + doc.name + ' (image decode failed).');
        };
        img.src = doc.imageDataUrl;
        return;
      }
      if (doc.template === 'gpu') {
        drawGPUDiagram(ctx, canvas.width, canvas.height);
      } else {
        clearCanvas(ctx, canvas.width, canvas.height);
      }
      setStatus('Opened ' + doc.name + '.');
    }

    function persistCurrentDoc(forceStatus) {
      var doc = currentDoc();
      if (!doc) return;
      if (doc.id === 'default-gpu-diagram') {
        if (forceStatus) setStatus('GPU Diagram.paint is protected and auto-restored.');
        return;
      }
      doc.imageDataUrl = canvas.toDataURL('image/png');
      doc.template = 'custom';
      doc.updatedAt = Date.now();
      savePaintDocs(docs);
      if (forceStatus) setStatus(doc.name + ' saved.');
    }

    function queueAutosave() {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(function() {
        persistCurrentDoc(false);
      }, 320);
    }

    function openDocByIndex(idx) {
      var next = Math.max(0, Math.min(docs.length - 1, Number(idx) || 0));
      currentDocIndex = next;
      renderFileSelect();
      loadDocIntoCanvas(currentDoc());
    }

    function createNewBlankDoc() {
      var name = 'Untitled ' + formatTimestamp() + '.paint';
      var nextDoc = {
        id: 'paint-doc-' + Date.now(),
        name: name,
        template: 'blank',
        imageDataUrl: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      docs.push(nextDoc);
      currentDocIndex = docs.length - 1;
      renderFileSelect();
      clearCanvas(ctx, canvas.width, canvas.height);
      persistCurrentDoc(true);
    }

    fileSelect.addEventListener('change', function() {
      openDocByIndex(fileSelect.value);
    });

    newBtn.addEventListener('click', function() {
      createNewBlankDoc();
    });

    saveBtn.addEventListener('click', function() {
      persistCurrentDoc(true);
    });

    clearBtn.addEventListener('click', function() {
      snapshot();
      clearCanvas(ctx, canvas.width, canvas.height);
      queueAutosave();
      setStatus('Canvas cleared.');
    });
    undoBtn.addEventListener('click', function() {
      if (!undoStack.length) {
        setStatus('Nothing to undo.');
        return;
      }
      restore(undoStack.pop());
    });
    var drawing = false;
    var lastX = 0;
    var lastY = 0;

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    canvas.addEventListener('mousedown', function(e) {
      var pos = getPos(e);
      if (currentTool === 'picker') {
        currentColor = getCanvasColor(ctx, canvas, Math.round(pos.x), Math.round(pos.y));
        setStatus('Picked ' + currentColor + '.');
        return;
      }
      if (currentTool === 'fill') {
        snapshot();
        floodFill(ctx, canvas, Math.round(pos.x), Math.round(pos.y), currentColor);
        queueAutosave();
        return;
      }
      snapshot();
      if (currentTool === 'line' || currentTool === 'rect' || currentTool === 'ellipse') {
        currentShape = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
        drawing = true;
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        return;
      }
      drawing = true;
      lastX = pos.x;
      lastY = pos.y;
    });

    canvas.addEventListener('mousemove', function(e) {
      if (!drawing) return;
      var pos = getPos(e);
      if (currentShape) {
        currentShape.x2 = pos.x;
        currentShape.y2 = pos.y;
        drawShapePreview(currentShape.x1, currentShape.y1, currentShape.x2, currentShape.y2);
        return;
      }
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
      ctx.lineWidth = getStrokeWidth();
      ctx.lineCap = 'round';
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
      queueAutosave();
    });

    canvas.addEventListener('mouseup', function() {
      if (currentShape) {
        commitShape();
      }
      drawing = false;
    });
    canvas.addEventListener('mouseleave', function() {
      if (currentShape) {
        drawShapePreview(currentShape.x1, currentShape.y1, currentShape.x2, currentShape.y2);
      }
      drawing = false;
    });

    wrap.tabIndex = 0;
    wrap.addEventListener('keydown', function(event) {
      if (event.ctrlKey && (event.key === 'z' || event.key === 'Z')) {
        event.preventDefault();
        if (undoStack.length) restore(undoStack.pop());
        return;
      }
      if (event.ctrlKey && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        persistCurrentDoc(true);
      }
    });

    renderFileSelect();
    openDocByIndex(0);
    snapshot();
    setTool('pencil');

    updateToolbarLayout();
    if (typeof ResizeObserver !== 'undefined') {
      toolbarObserver = new ResizeObserver(function() {
        updateToolbarLayout();
      });
      toolbarObserver.observe(wrap);
    } else {
      window.addEventListener('resize', updateToolbarLayout);
    }

    return wrap;
  }

  function drawGPUDiagram(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000080';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GPU Architecture Diagram', w / 2, 22);

    ctx.fillStyle = '#e0e0ff';
    ctx.fillRect(30, 40, 200, 140);
    ctx.strokeStyle = '#000080';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 40, 200, 140);
    ctx.fillStyle = '#000080';
    ctx.font = '10px monospace';
    ctx.fillText('SM Cluster', 130, 56);

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 8; col++) {
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(42 + col * 24, 68 + row * 26, 18, 18);
        ctx.strokeStyle = '#006600';
        ctx.strokeRect(42 + col * 24, 68 + row * 26, 18, 18);
      }
    }
    ctx.font = '8px monospace';
    ctx.fillStyle = '#006600';
    ctx.fillText('CUDA Cores', 130, 176);

    ctx.fillStyle = '#ffe0e0';
    ctx.fillRect(250, 40, 80, 140);
    ctx.strokeStyle = '#800000';
    ctx.strokeRect(250, 40, 80, 140);
    ctx.fillStyle = '#800000';
    ctx.font = '11px monospace';
    ctx.fillText('L2', 290, 90);
    ctx.fillText('Cache', 290, 110);
    ctx.font = '9px monospace';
    ctx.fillText('12MB', 290, 130);

    ctx.fillStyle = '#e0ffe0';
    ctx.fillRect(350, 40, 110, 140);
    ctx.strokeStyle = '#008000';
    ctx.strokeRect(350, 40, 110, 140);
    ctx.fillStyle = '#008000';
    ctx.font = '11px monospace';
    ctx.fillText('VRAM', 405, 90);
    ctx.font = '9px monospace';
    ctx.fillText('16GB GDDR6X', 405, 110);

    ctx.strokeStyle = '#444';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(230, 110);
    ctx.lineTo(250, 110);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(330, 110);
    ctx.lineTo(350, 110);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffcc';
    ctx.fillRect(30, 220, w - 60, 35);
    ctx.strokeStyle = '#808000';
    ctx.strokeRect(30, 220, w - 60, 35);
    ctx.fillStyle = '#808000';
    ctx.font = '11px monospace';
    ctx.fillText('PCIe 4.0 x16', w / 2, 242);

    ctx.strokeStyle = '#444';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 180);
    ctx.lineTo(w / 2, 220);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText('To Host CPU (Ryzen 7 7800X3D)', w / 2, 273);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#00aa00';
    ctx.fillRect(30, h - 30, 10, 10);
    ctx.fillStyle = '#000';
    ctx.font = '8px monospace';
    ctx.fillText('= CUDA Core', 44, h - 21);
    ctx.fillStyle = '#808080';
    ctx.fillText('RTX 4070 Ti SUPER - 8448 CUDA Cores', 30, h - 8);
  }

  function floodFill(ctx, canvas, startX, startY, fillColor) {
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imgData.data;
    var w = canvas.width;
    var h = canvas.height;
    var tmp = document.createElement('canvas').getContext('2d');
    tmp.fillStyle = fillColor;
    tmp.fillRect(0, 0, 1, 1);
    var fc = tmp.getImageData(0, 0, 1, 1).data;
    var idx = (startY * w + startX) * 4;
    if (idx < 0 || idx >= data.length) return;
    var tr = data[idx];
    var tg = data[idx + 1];
    var tb = data[idx + 2];
    if (tr === fc[0] && tg === fc[1] && tb === fc[2]) return;
    var stack = [[startX, startY]];
    var visited = new Uint8Array(w * h);
    while (stack.length > 0) {
      var pt = stack.pop();
      var x = pt[0];
      var y = pt[1];
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      var key = y * w + x;
      if (visited[key]) continue;
      var i = key * 4;
      if (Math.abs(data[i] - tr) > 10 || Math.abs(data[i + 1] - tg) > 10 || Math.abs(data[i + 2] - tb) > 10) continue;
      visited[key] = 1;
      data[i] = fc[0];
      data[i + 1] = fc[1];
      data[i + 2] = fc[2];
      data[i + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};
  parts.createPaint = createPaint;
})();
