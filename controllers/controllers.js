const { CustomAPIErrorHandler } = require("../errors/custom-errors");
const { StatusCodes } = require("http-status-codes");
const path = require("path");
const fs = require("fs");
const { Deepgram } = require("@deepgram/sdk");
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

const videoUploadPath = path.join(__dirname, "../server/uploads/");

const pushVideo = async (req, res) => {
    try {
        const video = req.files.video;

        if (!video) {
            throw new CustomAPIErrorHandler(
                "No video file uploaded",
                StatusCodes.BAD_REQUEST
            );
        }

        if (!video.mimetype.startsWith("video")) {
            throw new CustomAPIErrorHandler(
                "Please upload a video",
                StatusCodes.BAD_REQUEST
            );
        }

        const fileName = video.name;
        const uploadPath = path.join(videoUploadPath, fileName);

        // Create a write stream for the uploaded video file
        const writeStream = fs.createWriteStream(uploadPath);

        // Use the buffer data as a readable stream and pipe it to the write stream
        const readableStream = require("stream").Readable.from(video.data);
        readableStream.pipe(writeStream);

        // Listen for the 'finish' event to know when the write is complete
        writeStream.on("finish", () => {
            res
                .status(StatusCodes.OK)
                .json({ message: "Video uploaded successfully" });
        });

        writeStream.on("error", (err) => {
            throw new CustomAPIErrorHandler(
                "Error uploading the video",
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        });
    } catch (error) {
        res
            .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: error.message });
    }
};

const test = (req, res) => {
    res.status(StatusCodes.OK).send("Success");
};

const getVideos = async (req, res) => {
    try {
        const files = await fs.promises.readdir(videoUploadPath);
        const videoFiles = files.filter((file) => {
            const extname = path.extname(file).toLowerCase();
            return [".mp4", ".avi", ".mkv", ".webm"].includes(extname);
        });

        const videoUrls = videoFiles.map((file) => `/uploads/${file}`);

        res.status(StatusCodes.OK).json({ videos: videoUrls });
    } catch (error) {
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: error.message });
    }
};

const transcribeVideo = async (req, res) => {
    try {
        const { filename } = req.params
        console.log(filename)
        const response = await deepgram.transcription.preRecorded(
            { url: "https://hng-chrome-9smj.onrender.com/uploads/" + filename },
            { punctuate: true, utterances: true }
        )

        const srtTranscript = response.toSRT();

        res.status(200).json({
            status: "Success",
            transcript: srtTranscript
        })
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
}

module.exports = {
    pushVideo,
    test,
    getVideos,
    transcribeVideo
};
