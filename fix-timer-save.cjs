const fs = require('fs');
let code = fs.readFileSync('src/components/Timer.tsx', 'utf8');

code = code.replace(/    addSession\(\{\n      subjectId: currentSubjectId,\n      topicId: currentTopicId,\n      subject: subject \|\| 'Livre',\n      topic,\n      activityType,\n      source,\n      durationSeconds: elapsedTime,/,
`    addSession({
      subjectId: currentSubjectId,
      topicId: currentTopicId,
      activityId: activeTask?.activityId,
      subject: subject || 'Livre',
      topic,
      activityType,
      source,
      durationSeconds: elapsedTime,`);

fs.writeFileSync('src/components/Timer.tsx', code);
