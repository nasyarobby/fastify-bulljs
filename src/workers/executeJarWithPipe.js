/* eslint-disable no-console */
const { unlink, stat, readFile } = require('fs/promises');
const { createWriteStream } = require('fs');

module.exports = async function executeJarWithPipe(outputPath, commandToRun) {
  const pipePath = '/hostpipe/pipe';
  const outputPath2 = `/hostpipe/${outputPath}`;

  console.log('delete previous output');
  try {
    const fsStat = await stat(outputPath2);
    if (fsStat) unlink(outputPath2);
  } catch (err) {
    console.log('No file found... Continue...');
  }

  console.log('writing to pipe...');
  console.log(`${commandToRun} > ${outputPath2}`);
  const wstream = createWriteStream(pipePath);
  wstream.write(`${commandToRun} > ${outputPath2}`);
  wstream.close();

  console.log('waiting for output.txt...'); // there are better ways to do that than setInterval
  const timeout = 60000; // stop waiting after 10 seconds (something might be wrong)
  const timeoutStart = Date.now();
  return new Promise((res, rej) => {
    const myLoop = setInterval(async () => {
      if (Date.now() - timeoutStart > timeout) {
        clearInterval(myLoop);
        console.log('timed out');
        return rej(new Error('Timeout...'));
      }
      // if output.txt exists, read it
      try {
        const fsStat2 = await stat(outputPath2);
        if (fsStat2) {
          clearInterval(myLoop);
          const data = (await readFile(outputPath2)).toString();
          const fsStat3 = await stat(outputPath2);
          if (fsStat3) {
            unlink(outputPath2); // delete the output file
          }
          console.log(data); // log the output of the command
          return res(data);
        }
      } catch (err) {
        console.log('Waiting for output...');
      }
    }, 300);
  });
};
