// Blog Class - รับผิดชอบจัดการข้อมูลบล็อก
class Blog {
  constructor(id, title, content, tags = []) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.tags = tags;
    this.createdDate = new Date();
    this.updatedDate = new Date();
  }

  update(title, content, tags = []) {
    this.title = title;
    this.content = content;
    this.tags = tags;
    this.updatedDate = new Date();
  }

  getFormattedDate() {
    return this.updatedDate.toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

// BlogManager Class - รับผิดชอบจัดการ array ของบล็อก
class BlogManager {
  constructor() {
    this.blogs = [];
    this.loadFromLocalStorage();
  }

  addBlog(title, content, tags) {
    const blog = new Blog(Date.now(), title, content, tags);
    this.blogs.push(blog);
    this.sortBlogs();
    this.saveToLocalStorage();
    return blog;
  }

  updateBlog(id, title, content, tags) {
    const blog = this.getBlog(id);
    if (blog) {
      blog.update(title, content, tags);
      this.sortBlogs();
      this.saveToLocalStorage();
    }
    return blog;
  }

  deleteBlog(id) {
    this.blogs = this.blogs.filter((blog) => blog.id !== id);
    this.saveToLocalStorage();
  }

  getBlog(id) {
    return this.blogs.find((blog) => blog.id === id);
  }

  getAllTags() {
    const tagsSet = new Set();
    this.blogs.forEach((blog) => {
      blog.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }

  filterByTag(tag) {
    if (!tag) return this.blogs;
    return this.blogs.filter((blog) => blog.tags.includes(tag));
  }

  sortBlogs() {
    this.blogs.sort((a, b) => b.updatedDate - a.updatedDate);
  }

  saveToLocalStorage() {
    localStorage.setItem("blogs", JSON.stringify(this.blogs));
  }

  loadFromLocalStorage() {
    const storedBlogs = localStorage.getItem("blogs");
    if (storedBlogs) {
      const parsedBlogs = JSON.parse(storedBlogs);
      this.blogs = parsedBlogs.map((blog) => {
        const newBlog = new Blog(blog.id, blog.title, blog.content, blog.tags);
        newBlog.createdDate = new Date(blog.createdDate);
        newBlog.updatedDate = new Date(blog.updatedDate);
        return newBlog;
      });
    }
  }
}

// UI Class - รับผิดชอบจัดการ DOM และ Events
class BlogUI {
  constructor(blogManager) {
    this.blogManager = blogManager;
    this.initElements();
    this.initEventListeners();
    this.updateTagFilter();
    this.render();
  }

  initElements() {
    this.form = document.getElementById("blog-form");
    this.titleInput = document.getElementById("title");
    this.contentInput = document.getElementById("content");
    this.tagsInput = document.getElementById("tags");
    this.editIdInput = document.getElementById("edit-id");
    this.formTitle = document.getElementById("form-title");
    this.cancelBtn = document.getElementById("cancel-btn");
    this.blogList = document.getElementById("blog-list");
    this.tagFilter = document.getElementById("tag-filter");
  }

  initEventListeners() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.cancelBtn.addEventListener("click", () => {
      this.resetForm();
    });

    this.tagFilter.addEventListener("change", () => {
      this.render();
    });
  }

  handleSubmit() {
    const title = this.titleInput.value.trim();
    const content = this.contentInput.value.trim();
    const tags = this.tagsInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    const editId = parseInt(this.editIdInput.value);

    if (title && content) {
      if (editId) {
        this.blogManager.updateBlog(editId, title, content, tags);
      } else {
        this.blogManager.addBlog(title, content, tags);
      }
      this.resetForm();
      this.updateTagFilter();
      this.render();
    }
  }

  editBlog(id) {
    const blog = this.blogManager.getBlog(id);
    if (blog) {
      this.titleInput.value = blog.title;
      this.contentInput.value = blog.content;
      this.tagsInput.value = blog.tags.join(", ");
      this.editIdInput.value = blog.id;
      this.formTitle.textContent = "แก้ไขบล็อก";
      this.cancelBtn.classList.remove("hidden");
      window.scrollTo(0, 0);
    }
  }

  deleteBlog(id) {
    if (confirm("ต้องการลบบล็อกนี้ใช่หรือไม่?")) {
      this.blogManager.deleteBlog(id);
      this.updateTagFilter();
      this.render();
    }
  }

  updateTagFilter() {
    const tags = this.blogManager.getAllTags();
    const currentValue = this.tagFilter.value;

    this.tagFilter.innerHTML = '<option value="">ทั้งหมด</option>';
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      this.tagFilter.appendChild(option);
    });

    if (tags.includes(currentValue)) {
      this.tagFilter.value = currentValue;
    }
  }

  resetForm() {
    this.form.reset();
    this.editIdInput.value = "";
    this.formTitle.textContent = "เขียนบล็อกใหม่";
    this.cancelBtn.classList.add("hidden");
  }

  render() {
    const selectedTag = this.tagFilter.value;
    const blogsToShow = this.blogManager.filterByTag(selectedTag);

    this.blogList.innerHTML = blogsToShow
      .map(
        (blog) => `
                <div class="blog-post">
                    <h2 class="blog-title">${blog.title}</h2>
                    <div class="blog-date">
                        อัพเดทเมื่อ: ${blog.getFormattedDate()}
                    </div>
                    <div class="blog-tags">
                        ${blog.tags
                          .map((tag) => `<span class="tag">${tag}</span>`)
                          .join("")}
                    </div>
                    <div class="blog-content">
                        ${blog.content.replace(/\n/g, "<br>")}
                    </div>
                    <div class="blog-actions">
                        <button class="btn-edit" onclick="blogUI.editBlog(${
                          blog.id
                        })">แก้ไข</button>
                        <button class="btn-delete" onclick="blogUI.deleteBlog(${
                          blog.id
                        })">ลบ</button>
                    </div>
                </div>
                `
      )
      .join("");
  }
}

// สร้าง instance และเริ่มต้นใช้งาน
const blogManager = new BlogManager();
const blogUI = new BlogUI(blogManager);
 