document.addEventListener("DOMContentLoaded", () => {
    // Create menu container
    const contextMenu = document.createElement("div");
    contextMenu.id = "context-menu";

    // Title element
    const menuTitle = document.createElement("div");
    menuTitle.id = "menu-title";
    contextMenu.appendChild(menuTitle);

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "button-container";

    let wikiButton = initializeWikiButton(buttonContainer);
    let cancelButton = initializeCancelButton(buttonContainer);

    // Append to menu and body
    contextMenu.appendChild(buttonContainer);
    document.body.appendChild(contextMenu);

    // === RIGHT CLICK EVENT ===
    document.addEventListener("contextmenu", (event) => {
        let node = event.target.closest(".node");
        if (!node) return;
        event.preventDefault(); // Prevent default browser menu

        // Update title
        menuTitle.textContent = node.title || "Unknown Item";

        // Configure Wiki Button
        let wikiLink = node.dataset.wikiLink;
        if (wikiLink) {
            wikiButton.style.display = "block";
            wikiButton.onclick = () => {
                window.open(wikiLink, "_blank");
                contextMenu.style.display = "none";
            };
        } else {
            wikiButton.style.display = "none";
        }

        // Configure Cancel Button
        cancelButton.onclick = () => {
            contextMenu.style.display = "none";
        };

        // Position and show menu
        renderContextMenu(contextMenu, event);
    });

    // === CLICK OUTSIDE TO CLOSE ===
    document.addEventListener("click", (event) => {
        if (!contextMenu.contains(event.target)) {
            contextMenu.style.display = "none";
        }
    });
});

function initializeWikiButton(buttonContainer) {
    const wikiButton = document.createElement("button");
    wikiButton.id = "wiki-button";
    wikiButton.classList.add("menu-button");

    const whiteText = document.createElement("span");
    whiteText.classList.add("left-text");
    whiteText.textContent = "Go to ";

    const orangeText = document.createElement("span");
    orangeText.classList.add("right-text");
    orangeText.textContent = "Wiki";

    wikiButton.appendChild(whiteText);
    wikiButton.appendChild(orangeText);
    buttonContainer.appendChild(wikiButton);
    return wikiButton;
}

function initializeCancelButton(buttonContainer) {
    const cancelButton = document.createElement("button");
    cancelButton.id = "cancel-button";
    cancelButton.classList.add("menu-button");

    const cancelText = document.createElement("span");
    cancelText.classList.add("left-text");
    cancelText.textContent = "Cancel";

    cancelButton.appendChild(cancelText);
    buttonContainer.appendChild(cancelButton);
    return cancelButton;
}


function renderContextMenu(contextMenu, event) {
    // Ensure menu is temporarily visible to get accurate dimensions
    contextMenu.style.display = "block";
    contextMenu.style.visibility = "hidden"; // Prevents flickering

    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;


    let clickCoordX = event.pageX;
    let posX;
    if (clickCoordX - menuWidth / 2 < 0) { // Default rendering of box would clip out of window.
        posX = 0; // Solves issue!
    } else if (clickCoordX + menuWidth > screenWidth) {
        posX = clickCoordX - menuWidth;
        console.log("Right edge clip detected.")
        console.log("clickCoordX:", clickCoordX);
    } else {
        console.log("No clip detected.")
        posX = clickCoordX - menuWidth / 2; // Center menu horizontally at cursor
        console.log("clickCoordX:", clickCoordX);
    }
    let posY = event.pageY; // Keep top edge at cursor position

    // Right edge overflow: Shift left if menu overflows the screen


    if (posX + menuWidth > screenWidth) {
        posX = screenWidth - menuWidth; // Stick to right edge
    }
    // Left edge overflow: Shift right if menu goes off-screen
    if (posX < 0) {
        posX = 0;
    }
    // Bottom edge overflow: Move menu upwards if needed
    if (posY + menuHeight > screenHeight) {
        posY = screenHeight - menuHeight;
    }
    // Top edge overflow: Ensure the menu is always visible
    if (posY < 0) {
        posY = 0;
    }

    // Apply computed position
    contextMenu.style.top = `${posY}px`;
    contextMenu.style.left = `${posX}px`;
    contextMenu.style.visibility = "visible"; // Now show menu properly
}

