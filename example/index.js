new VirtualScroller({
  element: "#container",
  height: "80vh",
  rowHeight: 60,
  pageSize: 50,
  buffer: 3,
  renderItem(itemData) {
    const rowContent = document.createElement("div");
    rowContent.textContent = itemData;
    rowContent.classList.add("row-content");
    return rowContent;
  },
  loadMore(pageSize) {
    const data = [];

    for (let i = 0; i < pageSize; i++) {
      const itemData = `I'm number ${this.data.length + i}`;
      data.push(itemData);
    }

    return data;
  },
});
