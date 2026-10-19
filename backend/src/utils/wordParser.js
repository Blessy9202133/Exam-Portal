const mammoth = require('mammoth');
const { saveImageToServer } = require('./imageStorage');

/**
 * Parses a Word (.docx) file buffer into an array of Question objects.
 * Automatically extracts pasted images and saves them to the server's uploads/images directory.
 */
const parseWordDocument = async (fileBuffer, defaultDepartment = 'I&C') => {
  // Convert docx to HTML and save embedded images directly to the server
  const htmlResult = await mammoth.convertToHtml(
    { buffer: fileBuffer },
    {
      convertImage: mammoth.images.imgElement((image) => {
        return image.read().then((imageBuffer) => {
          const savedUrl = saveImageToServer(Buffer.from(imageBuffer), image.contentType || 'image/png');
          return {
            src: savedUrl,
          };
        });
      }),
    }
  );

  const html = htmlResult.value;

  let formattedText = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const lines = formattedText.split('\n').map((line) => line.trim()).filter(Boolean);

  const questions = [];
  let currentDept = defaultDepartment;
  let currentDifficulty = 'EASY';
  let currentType = 'MCQ';
  let currentMarks = 1;

  let currentQ = null;

  const saveCurrentQuestion = () => {
    if (currentQ && currentQ.questionText) {
      const qType = currentQ.questionType || 'MCQ';
      let options = [];
      let correctOptionIndex = 0;
      let correctOptions = [];
      let correctTextAnswer = currentQ.correctTextAnswer || '';

      if (qType === 'FILL_BLANK') {
        options = [];
        if (!correctTextAnswer && currentQ.options.length > 0) {
          correctTextAnswer = currentQ.options[0];
        }
      } else {
        options = [...currentQ.options];
        while (options.length < 4) {
          options.push(`Option ${options.length + 1}`);
        }
        options = options.slice(0, 4);

        if (qType === 'MULTIPLE') {
          correctOptions = currentQ.correctOptions && currentQ.correctOptions.length > 0
            ? currentQ.correctOptions
            : [currentQ.correctOptionIndex >= 0 ? currentQ.correctOptionIndex : 0];
          correctOptionIndex = correctOptions[0];
        } else {
          correctOptionIndex = currentQ.correctOptionIndex >= 0 ? currentQ.correctOptionIndex : 0;
          correctOptions = [correctOptionIndex];
        }
      }

      const matchedDept = (currentQ.department || currentDept || defaultDepartment).trim();

      questions.push({
        department: matchedDept,
        difficulty: currentQ.difficulty || currentDifficulty,
        questionType: qType,
        imageUrl: currentQ.imageUrl || '',
        questionText: currentQ.questionText.replace(/<[^>]*>/g, '').trim(),
        options,
        correctOptionIndex,
        correctOptions,
        correctTextAnswer,
        marks: currentQ.marks || currentMarks || 1,
        explanation: (currentQ.explanation || '').replace(/<[^>]*>/g, '').trim(),
      });
    }
    currentQ = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine.replace(/<[^>]*>/g, '').trim();

    // Extract embedded image tag if present
    const imgMatch = rawLine.match(/<img[^>]+src=["']([^"']+)["']/i);
    const lineImageUrl = imgMatch ? imgMatch[1] : '';

    // Skip template instruction lines at top of document
    if (
      /^Instructions for/i.test(cleanLine) ||
      /DEPARTMENT QUESTION BANK TEMPLATE/i.test(cleanLine) ||
      /^-{5,}/.test(cleanLine) ||
      /^[1-4]\.\s*(Department:|For MCQs|For Fill-in-the-Blanks|Pictures\/Diagrams)/i.test(cleanLine)
    ) {
      continue;
    }

    // 1-4. Detect Metadata tags ([Department: ...], [Type: ...], [Difficulty: ...], [Marks: ...]) on the same line
    const deptMatch = cleanLine.match(/\[(?:Department|Dept)\s*:\s*([^\]\n]+)\]/i);
    const typeMatch = cleanLine.match(/\[(?:Question\s*Type|Type)\s*:\s*(MCQ|MULTIPLE|FILL_BLANK|FILL\s*IN\s*THE\s*BLANK|CHECKBOX)\]/i);
    const diffMatch = cleanLine.match(/\[Difficulty\s*:\s*(EASY|MODERATE|TOUGH|COMPLEX)\]/i);
    const marksMatch = cleanLine.match(/\[Marks?\s*:\s*(\d+)\]/i);

    if (deptMatch || typeMatch || diffMatch || marksMatch) {
      if (deptMatch) {
        saveCurrentQuestion();
        currentDept = deptMatch[1].trim();
      }
      if (typeMatch) {
        let tStr = typeMatch[1].toUpperCase();
        if (tStr.includes('FILL')) tStr = 'FILL_BLANK';
        else if (tStr.includes('MULTI') || tStr.includes('CHECK')) tStr = 'MULTIPLE';
        else tStr = 'MCQ';
        if (currentQ) currentQ.questionType = tStr;
        else currentType = tStr;
      }
      if (diffMatch) {
        let diffStr = diffMatch[1].toUpperCase();
        if (diffStr === 'COMPLEX') diffStr = 'TOUGH';
        if (currentQ) currentQ.difficulty = diffStr;
        else currentDifficulty = diffStr;
      }
      if (marksMatch) {
        const parsedM = parseInt(marksMatch[1], 10);
        if (!isNaN(parsedM)) {
          if (currentQ) currentQ.marks = parsedM;
          else currentMarks = parsedM;
        }
      }
      continue;
    }

    // 5. Detect Question Start
    const qMatch = cleanLine.match(/^(?:Q(?:uestion)?\s*\d*[\.\:]?|\d+[\.\)])\s*(.+)/i);
    if (qMatch) {
      saveCurrentQuestion();
      currentQ = {
        department: currentDept,
        difficulty: currentDifficulty,
        questionType: currentType,
        imageUrl: lineImageUrl,
        questionText: qMatch[1].trim(),
        options: [],
        correctOptionIndex: -1,
        correctOptions: [],
        correctTextAnswer: '',
        marks: currentMarks,
        explanation: '',
      };
      continue;
    }

    // Attach image to current question if found in subsequent paragraph
    if (lineImageUrl && currentQ) {
      currentQ.imageUrl = lineImageUrl;
      if (!cleanLine) continue;
    }

    // 6. Detect Option
    const optMatch = cleanLine.match(/^(?:[\(\[]?([A-D1-4])[\)\.]?|Option\s+([A-D]))\s*(.+)/i);
    if (optMatch && currentQ) {
      const optText = optMatch[3].trim();
      const optionIndex = currentQ.options.length;
      currentQ.options.push(optText);

      if (/<(?:strong|b)>/i.test(rawLine) || /\(Correct\)/i.test(cleanLine) || /\[Correct\]/i.test(cleanLine)) {
        currentQ.correctOptionIndex = optionIndex;
        if (!currentQ.correctOptions.includes(optionIndex)) {
          currentQ.correctOptions.push(optionIndex);
        }
      }
      continue;
    }

    // 7. Detect Explicit Answer line
    const ansMatch = cleanLine.match(/^(?:Answer|Correct\s*Option|Ans)\s*:\s*(.+)/i);
    if (ansMatch && currentQ) {
      const ansVal = ansMatch[1].trim();
      if (currentQ.questionType === 'FILL_BLANK') {
        currentQ.correctTextAnswer = ansVal;
      } else {
        const chars = ansVal.toUpperCase().split(/[\s,]+/);
        const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, '1': 0, '2': 1, '3': 2, '4': 3 };
        const found = [];
        chars.forEach((c) => {
          if (map[c] !== undefined) found.push(map[c]);
        });
        if (found.length > 0) {
          currentQ.correctOptions = found;
          currentQ.correctOptionIndex = found[0];
          if (found.length > 1) {
            currentQ.questionType = 'MULTIPLE';
          }
        }
      }
      continue;
    }

    // 8. Detect Explanation
    const expMatch = cleanLine.match(/^Explanation\s*:\s*(.+)/i);
    if (expMatch && currentQ) {
      currentQ.explanation = expMatch[1].trim();
      continue;
    }

    if (currentQ) {
      if (currentQ.options.length === 0) {
        currentQ.questionText += ' ' + cleanLine;
      } else if (currentQ.explanation) {
        currentQ.explanation += ' ' + cleanLine;
      }
    }
  }

  saveCurrentQuestion();
  return questions;
};

module.exports = { parseWordDocument };
