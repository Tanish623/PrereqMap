
import { topicData } from "./topics.js";

// DOM elements
const topicInput = document.getElementById("topicInput");
const exploreBtn = document.getElementById("exploreBtn");
const message = document.getElementById("message");
const characterCount = document.getElementById("characterCount");
const topicList = document.getElementById("topicList");
const results = document.getElementById("results");
const resultContent = document.getElementById("resultContent");
const catalogCount = document.getElementById("catalogCount");

// Find topic (case-insensitive)
function searchTopic(name) {
    return topicData.find(topic =>
        topic.name.toLowerCase() === name.trim().toLowerCase()
    );
}

// Get all direct and indirect prerequisites
function getAllPrerequisites(topicName) {
    const visited = new Set();

    function explore(name) {
        const topic = searchTopic(name);

        if (!topic) return;

        for (const prerequisite of topic.prerequisites || []) {
            // Prevent duplicates and circular dependencies
            if (prerequisite === topicName || visited.has(prerequisite)) {
                continue;
            }

            visited.add(prerequisite);
            explore(prerequisite);
        }
    }

    explore(topicName);

    return [...visited];
}

// Get prerequisites grouped by distance from goal
function getLearningLevels(topicName) {
    const queue = [{ name: topicName, depth: 0 }];
    const distances = new Map([[topicName, 0]]);

    while (queue.length > 0) {
        const current = queue.shift();
        const topic = searchTopic(current.name);

        if (!topic) continue;

        for (const prerequisite of topic.prerequisites || []) {
            const nextDepth = current.depth + 1;

            if (
                !distances.has(prerequisite) ||
                nextDepth < distances.get(prerequisite)
            ) {
                distances.set(prerequisite, nextDepth);

                queue.push({
                    name: prerequisite,
                    depth: nextDepth
                });
            }
        }
    }

    distances.delete(topicName);

    const grouped = {};

    for (const [name, depth] of distances) {
        if (!grouped[depth]) {
            grouped[depth] = [];
        }

        grouped[depth].push(name);
    }

    const levels = Object.keys(grouped)
        .sort((a, b) => Number(b) - Number(a))
        .map(depth => ({
            depth: Number(depth),
            topics: grouped[depth]
        }));

    return levels;
}

// Create topic catalog
function displayTopics() {
    topicList.replaceChildren();

    catalogCount.textContent =
        `${topicData.length} topics available`;

    topicData.forEach(topic => {
        const card = document.createElement("button");
        card.className = "topic-card";
        card.type = "button";

        const icon = document.createElement("div");
        icon.className = "topic-icon";
        icon.textContent = topic.icon || "📚";

        const heading = document.createElement("h3");
        heading.textContent = topic.name;

        const description = document.createElement("p");
        description.textContent = topic.description || "";

        const category = document.createElement("p");
        category.textContent = topic.category || "";
        category.style.marginTop = "8px";
        category.style.fontWeight = "700";

        const link = document.createElement("span");
        link.className = "card-link";
        link.textContent = "Explore prerequisites →";

        card.append(
            icon,
            heading,
            description,
            category,
            link
        );

        card.addEventListener("click", () => {
            topicInput.value = topic.name;

            characterCount.textContent =
                `${topicInput.value.length} characters`;

            exploreTopic();
        });

        topicList.appendChild(card);
    });
}

// Display learning map
function displayMap(topic, levels) {
    const panel = document.createElement("div");
    panel.className = "map-panel";

    const heading = document.createElement("h3");
    heading.textContent = "Your prerequisite learning map";

    const description = document.createElement("p");
    description.className = "panel-description";
    description.textContent =
        "Start with foundational topics and progress towards your goal.";

    panel.append(heading, description);

    levels.forEach(level => {
        const levelContainer = document.createElement("div");
        levelContainer.className = "map-level";

        const label = document.createElement("div");
        label.className = "level-label";

        label.textContent = level.depth === 0
            ? "YOUR GOAL"
            : `LEVEL ${level.depth} · FOUNDATIONS`;

        const nodes = document.createElement("div");
        nodes.className = "level-nodes";

        level.topics.forEach(name => {
            const node = document.createElement("div");
            node.className = "map-node";

            if (level.depth === 0) {
                node.classList.add("goal");
            }

            const strong = document.createElement("strong");
            strong.textContent = name;

            const small = document.createElement("small");
            small.textContent = level.depth === 0
                ? "Target topic"
                : "Prerequisite";

            node.append(strong, small);
            nodes.appendChild(node);
        });

        levelContainer.append(label, nodes);
        panel.appendChild(levelContainer);

        if (level.depth > 0) {
            const arrow = document.createElement("div");
            arrow.className = "map-arrow";
            arrow.textContent = "↓";

            panel.appendChild(arrow);
        }
    });

    return panel;
}

// Display direct and indirect prerequisites
function displayDetails(direct, indirect) {
    const grid = document.createElement("div");
    grid.className = "detail-grid";

    function createCard(title, topics) {
        const card = document.createElement("div");
        card.className = "detail-card";

        const heading = document.createElement("h3");
        heading.textContent = title;

        card.appendChild(heading);

        if (topics.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent = "No prerequisites found.";

            card.appendChild(empty);
        }

        topics.forEach(name => {
            const item = document.createElement("div");
            item.className = "detail-item";

            const topicName = document.createElement("strong");
            topicName.textContent = name;

            const topic = searchTopic(name);

            const category = document.createElement("span");
            category.textContent = topic ? topic.category || "" : "";

            item.append(topicName, category);
            card.appendChild(item);
        });

        return card;
    }

    grid.append(
        createCard("Direct prerequisites", direct),
        createCard("Indirect prerequisites", indirect)
    );

    return grid;
}

// Main search function
function exploreTopic() {
    const name = topicInput.value.trim();

    // Clear previous results
    resultContent.replaceChildren();
    results.hidden = true;

    // Validate input
    if (!name) {
        message.textContent = "Please enter a topic first.";
        return;
    }

    if (name.length < 2) {
        message.textContent =
            "Please enter at least 2 characters.";
        return;
    }

    // Search for topic
    const topic = searchTopic(name);

    if (!topic) {
        message.textContent =
            "Topic not found. Try one of the suggested topics below.";
        return;
    }

    message.textContent =
        `Showing learning path for ${topic.name}.`;

    // Calculate prerequisites
    const all = getAllPrerequisites(topic.name);

    const direct = [...(topic.prerequisites || [])];

    const indirect = all.filter(
        item => !direct.includes(item)
    );

    // Generate learning levels
    const levels = getLearningLevels(topic.name);

    // Results header
    const header = document.createElement("div");
    header.className = "results-header";

    const eyebrow = document.createElement("span");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "YOUR PERSONAL LEARNING PATH";

    const title = document.createElement("h2");
    title.textContent = topic.name;

    const subtitle = document.createElement("p");
    subtitle.textContent = topic.description || "";

    header.append(eyebrow, title, subtitle);

    // Statistics
    const stats = document.createElement("div");
    stats.className = "stats-row";

    const values = [
        [direct.length, "Direct prerequisites", "📚"],
        [indirect.length, "Indirect prerequisites", "🔗"],
        [all.length, "Total foundations", "🏆"]
    ];

    values.forEach(([number, label, icon]) => {
        const card = document.createElement("div");
        card.className = "stat-card";

        const iconEl = document.createElement("span");
        iconEl.className = "stat-icon";
        iconEl.textContent = icon;

        const strong = document.createElement("strong");
        strong.textContent = number;

        const span = document.createElement("span");
        span.textContent = label;

        card.append(iconEl, strong, span);

        // Important: Add card to statistics container
        stats.appendChild(card);
    });

    // Display all results
    resultContent.append(
        header,
        stats,
        displayMap(topic, [
            ...levels,
            { depth: 0, topics: [topic.name] }
        ]),
        displayDetails(direct, indirect)
    );

    results.hidden = false;

    // Animate map nodes
    setTimeout(() => {
        resultContent
            .querySelectorAll(".map-node")
            .forEach((node, index) => {
                setTimeout(() => {
                    node.classList.add("visible");
                }, index * 80);
            });
    }, 200);

    // Scroll to results
    results.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Event listeners

// Explore button
exploreBtn.addEventListener("click", exploreTopic);

// Character counter
topicInput.addEventListener("input", () => {
    characterCount.textContent =
        `${topicInput.value.length} characters`;
});

// Enter key support
topicInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        exploreTopic();
    }
});

// Quick topic buttons
document.querySelectorAll(".quick-topic").forEach(button => {
    button.addEventListener("click", () => {
        topicInput.value = button.dataset.topic;

        characterCount.textContent =
            `${topicInput.value.length} characters`;

        exploreTopic();
    });
});

// Initialize project
displayTopics();

// Animate topic cards
setTimeout(() => {
    document.querySelectorAll(".topic-card").forEach((card, index) => {
        setTimeout(() => {
            card.classList.add("visible");
        }, index * 80);
    });
}, 200);
