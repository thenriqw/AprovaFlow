const fs = require('fs');

let content = fs.readFileSync('src/components/Timer.tsx', 'utf-8');

const target = `    addSession({
      subjectId: currentSubjectId,
      topicId: currentTopicId,
      activityId: activeTask?.activityId,
      subject: subject || 'Livre',
      topic,
      activityType,
      source,
      durationSeconds: elapsedTime,
      questionsTotal: parseInt(questions.total) || 0,
      questionsCorrect: parseInt(questions.correct) || 0,
      errorReasons: questions.errorReason ? [questions.errorReason] : []
    });`;

const replacement = `    addSession({
      subjectId: currentSubjectId,
      topicId: currentTopicId,
      activityId: activeTask?.activityId,
      subject: subject || 'Livre',
      topic,
      activityType,
      source,
      durationSeconds: elapsedTime,
      questionsTotal: parseInt(questions.total) || 0,
      questionsCorrect: parseInt(questions.correct) || 0,
      errorReasons: questions.errorReason ? [questions.errorReason] : [],
      difficulty
    });`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Timer.tsx', content);
  console.log("Patched Timer.tsx to pass difficulty");
} else {
  console.log("Target not found in Timer.tsx");
}
