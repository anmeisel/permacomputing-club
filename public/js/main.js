// Tag filtering functionality
// This script automatically checks if there's a tag in the URL hash when the page loads. When a tag is present in the URL, only items with matching tags will be displayed. When no tag is in the URL, all items are shown. If no items match the selected tag, a "No items found..." message appears with a "View all items" link to clear the filter.

document.addEventListener("DOMContentLoaded", function () {
  // Function to filter items based on tag in URL hash
  function filterItemsByTag() {
    // Get the current hash from the URL without the # symbol
    const currentTag = window.location.hash.substring(1);

    // If there's no tag in the URL, show all items
    if (!currentTag) {
      // Show all content blocks
      document.querySelectorAll(".content-block").forEach((block) => {
        block.style.display = "block";
      });

      // Remove any existing "no results" message
      const existingMessage = document.getElementById("no-results-message");
      if (existingMessage) {
        existingMessage.remove();
      }
      return;
    }

    // Get all content blocks
    const contentBlocks = document.querySelectorAll(".content-block");
    let matchFound = false;

    // Loop through each content block
    contentBlocks.forEach((block) => {
      // Get the description container where tags might be - specifically in the item-tags container
      const tagsContainer = block.querySelector(".item-tags");

      // If no tags container exists, hide this block
      if (!tagsContainer) {
        block.style.display = "none";
        return;
      }

      // Look for tag links within the tags container
      const tagLinks = tagsContainer.querySelectorAll(".tag-link");
      let hasMatchingTag = false;

      tagLinks.forEach((link) => {
        // Get the full tag text including the # symbol
        const linkText = link.textContent.trim();
        // Extract just the tag name for comparison
        const linkTag = linkText.substring(1); // Remove # from #sky

        if (linkTag.toLowerCase() === currentTag.toLowerCase()) {
          hasMatchingTag = true;
          matchFound = true;
        }
      });

      // Show or hide based on tag match
      block.style.display = hasMatchingTag ? "block" : "none";
    });

    // Show a message if no items match the tag
    const contentContainer =
      document.querySelector(".content-container") || document.body;

    // Remove any existing "no results" message
    const existingMessage = document.getElementById("no-results-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // If no visible items, show a message
    if (!matchFound) {
      const message = document.createElement("div");
      message.id = "no-results-message";
      message.classList.add("no-results");
      message.innerHTML = `<p>No items found with tag "#${currentTag}". <a href="/">View all items</a></p>`;

      // Insert the message at the beginning of the content container
      contentContainer.insertBefore(message, contentContainer.firstChild);
    }
  }

  // Run filter on page load
  filterItemsByTag();

  // Also run filter when hash changes (for navigation without page reload)
  window.addEventListener("hashchange", filterItemsByTag);

  // Add click event listeners to tag links
  document.querySelectorAll(".tag-link").forEach((tagLink) => {
    tagLink.addEventListener("click", function (e) {
      // Get the tag from the link text (remove the # symbol)
      const tag = this.textContent.trim().substring(1);

      // Update URL hash without page reload
      window.location.href = window.location.origin + "/#" + tag;

      // Prevent default anchor behavior
      e.preventDefault();
    });
  });
});
