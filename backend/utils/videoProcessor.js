const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs-extra');
const path = require('path');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Trims a video file based on start and end times
 * @param {string} inputPath - Path to the original video file
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @param {string} outputPath - Path where the trimmed video will be saved
 * @returns {Promise<string>} - Path to the trimmed video
 */
const trimVideo = (inputPath, startTime, endTime, outputPath) => {
  return new Promise((resolve, reject) => {
    // Ensure the output directory exists
    fs.ensureDirSync(path.dirname(outputPath));
    
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .output(outputPath)
      .on('end', () => {
        console.log('Video trimming completed');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error trimming video:', err);
        reject(err);
      })
      .run();
  });
};

module.exports = {
  trimVideo
};