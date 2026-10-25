
const topicInput = document.getElementById("topicInput");
const exploreBtn = document.getElementById("exploreBtn");
const message = document.getElementById("message");
const characterCount = document.getElementById("characterCount");

function validateTopic(topic) {
    const cleanTopic = topic.trim();

    if (cleanTopic === "") {
        return "Please enter a topic first.";
    }

    if (cleanTopic.length < 3) {
        return "Please enter at least 3 characters.";
    }

    return `Great! We'll build a learning map for ${cleanTopic}.`;
}

function exploreTopic() {
    const topic = topicInput.value;
    message.textContent = validateTopic(topic);
}

exploreBtn.addEventListener("click", exploreTopic);

topicInput.addEventListener("input", function () {
    characterCount.textContent =
        `Characters: ${topicInput.value.length}`;
});

topicInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        exploreTopic();
    }
});
