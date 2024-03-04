// GCS File Interactions and Local File Interactions
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { rejects } from "assert";

const storage = new Storage();

const rawVideoBucketName = "laughin-yt-raw-videos";
const processedVideoBucketName = "laughin-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/**
 * Creates the local directories for raw and processed videos
 */
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 * 
 * @param rawVideoName The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName The name of the file to convert to {@link localProcessedVideoPath}.
*  @returns A promise that resolves when the video has been converted 
*/
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions("-vf", "scale=-1:360")
        .on("end", () => {
            console.log("Processing finished successfully");
            resolve();
        })
        .on("error", (err) => {
            console.log(`An error occured: ${err.message}`)
            reject(err);
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`);
    })
}

/**
 * @param fileName The name of the file to download
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded. 
 */
export async function downloadRawVideo(fileName: string)
{
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({destination: `${localRawVideoPath}/${fileName}`})

        console.log(`gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`);
}

/**
 * @param fileName The name of the file to upload
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName} folder.
 * @returns A promise that resolves when the file has been uploaded. 
 */
export async function uploadProcessedVideo(fileName:string) {
    const bucket = storage.bucket(localProcessedVideoPath);

    bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName
    });

    console.log(`gs://${localProcessedVideoPath}/${fileName} uploaded to ${processedVideoBucketName}/${fileName}`);

    await bucket.file(fileName).makePublic();
}

function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath))
        {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}.`, err);
                    reject(err);
                }
                else
                {
                    console.log(`File deleted at ${filePath}`);
                    resolve();
                }
            })
        }
        else
        {
            console.log(`File not found at ${filePath}, skipping the delete`);
            resolve();
        }
    })
}

/**
 * Deletes the original raw video
 * @param fileName The file name of hte file to delete that is raw
 * @returns Output whether the file was deleted or not
 */
export function deleteRawVideo(fileName: string)
{
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/**
 * Delete a processed video
 * @param fileName The file name of the file to delete
 * @returns Output whether the file was deleted or not
 */
export function deleteProcessedVideo(fileName: string)
{
    return deleteProcessedVideo(`${localProcessedVideoPath}/${fileName}`);
}

function ensureDirectoryExistence(dirPath :string)
{
    if (!fs.existsSync(dirPath))
    {
        fs.mkdirSync(dirPath, { recursive: true});
        console.log(`Directory created at ${dirPath}`);
    }
}