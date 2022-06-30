class VirtualScroller {
  constructor({
    element,
    height,
    rowHeight,
    pageSize,
    buffer,
    renderItem,
    loadMore,
  }) {
    if (typeof element === "string") {
      this.scroller = document.querySelector(element);
    } else if (element instanceof HTMLElement) {
      this.scroller = element;
    }

    if (!this.scroller) {
      throw new Error("Invalid element");
    }

    if (!height || (typeof height !== "number" && typeof height !== "string")) {
      throw new Error("Invalid height value");
    }

    if (!rowHeight || typeof rowHeight !== "number") {
      throw new Error("rowHeight value must be a number");
    }

    if (typeof renderItem !== "function") {
      throw new Error("RenderItem must be a function");
    }

    if (typeof loadMore !== "function") {
      throw new Error("loadMore not a function");
    }

    // set props
    this.height = height;
    this.rowHeight = rowHeight;
    this.pageSize =
      typeof pageSize === "number" && pageSize > 0 ? pageSize : 50;
    this.buffer = typeof buffer === "number" && buffer > 0 ? buffer : 3;
    this.renderItem = renderItem;
    this.loadMore = loadMore;
    this.data = [];
    this.fragment = document.createDocumentFragment();

    // create content box
    const contentBox = document.createElement("div");
    this.contentBox = contentBox;
    this.scroller.append(contentBox);

    this.scroller.style.height =
      typeof height === "string" ? height : height + "px";

    this.loadInitData();
    this.scroller.addEventListener("scroll", this.handleScroll);
  }

  scrollTop = 0;
  topHiddenCount = 0;
  bottomHiddenCount = 0;
  paddingTop = 0;
  paddingBottom = 0;

  loadInitData() {
    const { clientHeight } = this.scroller;
    const minCount = Math.ceil(clientHeight / this.rowHeight);
    const page = Math.ceil(minCount / this.pageSize);
    const newData = this.loadMore(page * this.pageSize);
    this.data.push(...newData);
    this.renderNewData(newData.slice(0, minCount + this.buffer));
    this.contentBox.style.paddingBottom =
      (newData.length - (minCount + this.buffer)) * this.rowHeight + "px";
  }

  renderNewData(data) {
    data.forEach((item) => this.fragment.append(this.renderRow(item)));
    this.contentBox.append(this.fragment);
  }

  renderRow(item) {
    const rowContent = this.renderItem(item);
    const row = document.createElement("div");
    row.dataset.index = item;
    row.style.height = this.rowHeight + "px";
    row.append(rowContent);
    return row;
  }

  handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;

    if (scrollHeight - (scrollTop + clientHeight) < 40) {
      const newData = this.loadMore(this.pageSize);
      this.data.push(...newData);
    }

    // 方向
    const direction = scrollTop > this.scrollTop ? 1 : -1;

    this.toggleTopItems(direction);
    this.toggleBottomItems(direction);

    this.scrollTop = scrollTop;
  };

  toggleTopItems(direction) {
    const { scrollTop, clientHeight } = this.scroller;

    const firstVisibleItemIndex = Math.floor(scrollTop / this.rowHeight);
    const firstExistingItemIndex = Math.max(
      0,
      firstVisibleItemIndex - this.buffer
    );
    const rows = this.contentBox.children;

    if (direction === 1) {
      for (let i = this.topHiddenCount; i < firstExistingItemIndex; i++) {
        const row = rows[0];
        if (row) {
          this.fragment.append(row);
        }
      }
    } else if (direction === -1) {
      const fragment = document.createDocumentFragment();
      for (let i = this.topHiddenCount - 1; i >= firstExistingItemIndex; i--) {
        const item = this.data[i];
        if (item) {
          let row = this.fragment[0];
          if (row) {
            row.dataset.index = item;
            row.innerHtml = "";
            row.append(this.renderItem(item));
          } else {
            row = this.renderRow(item);
          }
          fragment.prepend(row);
        }
      }

      this.contentBox.prepend(fragment);
    }

    this.topHiddenCount = firstExistingItemIndex;
    this.paddingTop = this.topHiddenCount * this.rowHeight;
    this.contentBox.style.paddingTop = this.paddingTop + "px";
  }

  toggleBottomItems(direction) {
    const { scrollTop, clientHeight } = this.scroller;
    const lastVisibleItemIndex = Math.floor(
      (scrollTop + clientHeight) / this.rowHeight
    );
    const lastExistingItemIndex = lastVisibleItemIndex + this.buffer;
    const rows = [...this.contentBox.children];

    if (direction === 1) {
      const fragment = document.createDocumentFragment();
      for (
        let i = this.topHiddenCount + rows.length;
        i <= lastExistingItemIndex;
        i++
      ) {
        const item = this.data[i];

        if (item) {
          let row = this.fragment[0];
          if (row) {
            row.dataset.index = item;
            row.innerHtml = "";
            row.append(this.renderItem(item));
          } else {
            row = this.renderRow(item);
          }
          fragment.appendChild(row);
        }
      }

      this.contentBox.appendChild(fragment);
    } else if (direction === -1) {
      const total = this.topHiddenCount + this.contentBox.children.length;
      for (let i = lastExistingItemIndex; i < total; i++) {
        const row = rows[i - this.topHiddenCount];
        if (row) {
          this.fragment.appendChild(row);
        }
      }
    }

    this.bottomHiddenCount = Math.max(
      0,
      this.data.length -
        this.topHiddenCount -
        this.contentBox.children.length -
        this.buffer
    );
    this.lastExistingItemIndex = lastExistingItemIndex;
    this.paddingBottom = this.bottomHiddenCount * this.rowHeight;
    this.contentBox.style.paddingBottom = this.paddingBottom + "px";
  }
}
