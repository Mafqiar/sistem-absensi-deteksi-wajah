const video = document.getElementById("video");
const studentTable = document.getElementById("studentTable");
const downloadBtn = document.getElementById("downloadBtn");
const tbody = studentTable.querySelector("tbody");

Promise.all([faceapi.nets.ssdMobilenetv1.loadFromUri("/models"), faceapi.nets.faceRecognitionNet.loadFromUri("/models"), faceapi.nets.faceLandmark68Net.loadFromUri("/models")]).then(startWebcam);

function startWebcam() {
    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: false,
        })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch((error) => {
            console.error(error);
        });
}

function getLabeledFaceDescriptions() {
    const labels = [
        "AiniDiah", 
        "AiniNurul", 
        "Amelia", 
        "Azis",  
        "Daffa", 
        "Danu", 
        "Dea", 
        "Delfito", 
        "Egi", 
        "Falia", 
        "Ferdy", 
        "Ghessa", 
        "Gian", 
        "Maulana",
        "Helsa",  
        "Jovan", 
        "Mentari", 
        "Mey", 
        "Nayara", 
        "Novia", 
        "Rachma", 
        "Rachmat", 
        "Rafi", 
        "Raka", 
        "Regi", 
        "Reihan", 
        "Reza", 
        "Rivaldo",
        "Rofa'ul", 
        "Sendi", 
        "Syifa",
        "Yasmin"
    ];
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`./labels/${label}/${i}.png`);
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                descriptions.push(detections.descriptor);
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}

const studentData = {};


video.addEventListener("play", async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map((d) => {
            return faceMatcher.findBestMatch(d.descriptor);
        });

        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result,
            });
            drawBox.draw(canvas);
            // const studentName = result.toString();
            const studentName = result.label;

            
            if (!studentData[studentName]) {
                // Jika tidak, tambahkan data baru
                studentData[studentName] = {
                    number: Object.keys(studentData).length + 1,
                    name: studentName,
                    time: new Date().toLocaleTimeString(),
                    date: new Date().toLocaleDateString(),
                };
                tbody.innerHTML = "";

                const row = tbody.insertRow();
                row.insertCell(0).textContent = studentData[studentName].number;
                row.insertCell(1).textContent = studentData[studentName].name;
                row.insertCell(2).textContent = studentData[studentName].time;
                row.insertCell(3).textContent = studentData[studentName].date;

                // Tambahkan data ke dalam JSON
                const jsonData = JSON.stringify(studentData, null, 2);
                console.log(jsonData);

                // Konversi data JSON ke dalam format CSV
                const csvData = Object.values(studentData)
                    .map((student) => Object.values(student).join(","))
                    .join("\n");
                console.log(csvData);

                // Mengaktifkan tombol download
                downloadBtn.disabled = false;

                // Memproses unduhan CSV ketika tombol ditekan
                downloadBtn.addEventListener("click", () => {
                    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
                    saveAs(blob, "student_data.csv");
                });
            }
        });
    }, 100);
});
