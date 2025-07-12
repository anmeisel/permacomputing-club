// Tag filtering functionality with sidebar display
// This script automatically checks if there's a tag in the URL hash when the page loads. When a tag is present in the URL, only items with matching tags will be displayed. When no tag is in the URL, all items are shown. If no items match the selected tag, a "No items found..." message appears with a "View all items" link to clear the filter.
// Filters items in appropriate sidebars while hiding them from main content.

document.addEventListener("DOMContentLoaded", function () {
  // Function to filter items based on tag in URL hash
  function filterItemsByTag() {
    // Get the current hash from the URL without the # symbol
    const currentTag = window.location.hash.substring(1);

    const leftSidebar = document.querySelector(".sidebar.left");
    const rightSidebar = document.querySelector(".sidebar.right");

    // If there's no tag in the URL, show all items in main content and clear sidebars
    if (!currentTag) {
      // Show all content blocks in main content
      document.querySelectorAll(".content-block").forEach((block) => {
        block.style.display = "block";
      });

      // Clear any filtered content from sidebars (keep original titles)
      clearSidebarContent(leftSidebar, "Notes");
      clearSidebarContent(rightSidebar, "Events");

      // Remove any existing "no results" message
      const existingMessage = document.getElementById("no-results-message");
      if (existingMessage) {
        existingMessage.remove();
      }
      return;
    }

    // Handle special cases for 'notes' and 'event' tags
    if (
      currentTag.toLowerCase() === "notes" ||
      currentTag.toLowerCase() === "event"
    ) {
      handleSidebarFiltering(currentTag.toLowerCase());
      return;
    }

    // Call regular tag filtering
    handleRegularTagFiltering(currentTag);
  }

  // Handle sidebar filtering
  function handleSidebarFiltering(tagType) {
    const contentBlocks = document.querySelectorAll(".content-block");
    const targetSidebar =
      tagType === "notes"
        ? document.querySelector(".sidebar.left")
        : document.querySelector(".sidebar.right");

    let matchingItems = [];

    // Find all items with the specified tag
    contentBlocks.forEach((block) => {
      const tagsContainer = block.querySelector(".item-tags");
      if (!tagsContainer) return;

      const tagLinks = tagsContainer.querySelectorAll(".tag-link");
      let hasMatchingTag = false;

      tagLinks.forEach((link) => {
        const linkText = link.textContent.trim();
        const linkTag = linkText.substring(1); // Remove # from #tag

        if (linkTag.toLowerCase() === tagType) {
          hasMatchingTag = true;
        }
      });

      if (hasMatchingTag) {
        matchingItems.push(block.cloneNode(true));
        // Hide the item from main content
        block.style.display = "none";
      } else {
        // Show items that don't match in main content, but always hide notes
        block.style.display = "block";
      }
    });

    // Clear and populate the target sidebar
    const sidebarTitle = tagType === "notes" ? "Notes" : "Events";
    clearSidebarContent(targetSidebar, sidebarTitle);

    if (matchingItems.length > 0) {
      matchingItems.forEach((item) => {
        targetSidebar.appendChild(item);
      });
    } else {
      // Show "no items" message in sidebar
      const noItemsMsg = document.createElement("p");
      noItemsMsg.textContent = `No ${tagType} found.`;
      noItemsMsg.style.fontStyle = "italic";
      noItemsMsg.style.color = "#666";
      targetSidebar.appendChild(noItemsMsg);
    }

    // Clear the other sidebar
    const otherSidebar =
      tagType === "notes"
        ? document.querySelector(".sidebar.right")
        : document.querySelector(".sidebar.left");
    const otherTitle = tagType === "notes" ? "Events" : "Notes";
    clearSidebarContent(otherSidebar, otherTitle);
  }

  // Handle regular tag filtering
  function handleRegularTagFiltering(currentTag) {
    const contentBlocks = document.querySelectorAll(".content-block");
    let matchFound = false;

    // Clear sidebars for regular tag filtering
    clearSidebarContent(document.querySelector(".sidebar.left"), "Notes");
    clearSidebarContent(document.querySelector(".sidebar.right"), "Events");

    // Loop through each content block
    contentBlocks.forEach((block) => {
      const tagsContainer = block.querySelector(".item-tags");

      if (!tagsContainer) {
        block.style.display = "none";
        return;
      }

      const tagLinks = tagsContainer.querySelectorAll(".tag-link");
      let hasMatchingTag = false;

      tagLinks.forEach((link) => {
        const linkText = link.textContent.trim();
        const linkTag = linkText.substring(1);

        if (linkTag.toLowerCase() === currentTag.toLowerCase()) {
          hasMatchingTag = true;
          matchFound = true;
        }
      });

      block.style.display = hasMatchingTag ? "block" : "none";
    });

    // Show message if no items match the tag
    const contentContainer =
      document.querySelector(".content-container") || document.body;
    const existingMessage = document.getElementById("no-results-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    if (!matchFound) {
      const message = document.createElement("div");
      message.id = "no-results-message";
      message.classList.add("no-results");
      message.innerHTML = `<p>No items found with tag "#${currentTag}". <a href="/">View all items</a></p>`;
      contentContainer.insertBefore(message, contentContainer.firstChild);
    }
  }

  // Helper function to clear sidebar content while keeping the title
  function clearSidebarContent(sidebar) {
    if (!sidebar) return;

    // Remove all content except the h1 title
    const children = Array.from(sidebar.children);
    children.forEach((child) => {
      if (child.tagName !== "H1") {
        child.remove();
      }
    });
  }

  // Run filter on page load
  filterItemsByTag();

  // Also run filter when hash changes (for navigation without page reload)
  window.addEventListener("hashchange", filterItemsByTag);

  // Add click event listeners to tag links
  document.querySelectorAll(".tag-link").forEach((tagLink) => {
    tagLink.addEventListener("click", function (e) {
      const tag = this.textContent.trim().substring(1);
      window.location.href = window.location.origin + "/#" + tag;
      e.preventDefault();
    });
  });

  // Add click event listeners to sidebar titles
  document.querySelectorAll(".sidebar h1 a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const href = this.getAttribute("href");

      // Extract the tag from href (e.g., "/#notes" -> "notes")
      if (href && href.startsWith("/#")) {
        const tag = href.substring(2);
        window.location.href = window.location.origin + "/#" + tag;
      }
    });
  });
});
