import "@babel/polyfill";
import axios from "axios";

const api = axios.create({
  baseURL: "https://vast-flyingfish.glitch.me/"
});

// Axios Interceptor - 그때그때 다른 설정 사용하기
// axios에는 매번 요청이 일어나기 직전에 **설정 객체를 가로채서** 원하는대로 편집할 수 있는 기능이 있습니다.
api.interceptors.request.use(function(config) {
  // localStorage에 token이 있으면 요청에 헤더 설정, 없으면 아무것도 하지 않음
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = "Bearer " + token;
  }
  return config;
});

const templates = {
  loginForm: document.querySelector("#login-form").content,
  todoList: document.querySelector("#todo-list").content,
  todoItem: document.querySelector("#todo-item").content
};

const rootEl = document.querySelector(".root");

function drawLoginForm() {
  // 1. 템플릿 복사하기
  const fragment = document.importNode(templates.loginForm, true);

  // 2. 내용 채우고, 이벤트 리스너 등록하기
  const loginFormEl = fragment.querySelector(".login-form");

  loginFormEl.addEventListener("submit", async e => {
    e.preventDefault();
    // e: 이벤트 객체
    // e.target: 이벤트를 실제로 일으킨 요소 객체 (여기서는 loginFormEl)
    // e.target.elements: 폼 내부에 들어있는 요소 객체를 편하게 가져올 수 있는 특이한 객체
    // e.target.elements.username: name 어트리뷰트에 username이라고 지정되어있는 input 요소 객체
    // .value: 사용자가 input 태그에 입력한 값
    const username = e.target.elements.username.value;
    const password = e.target.elements.password.value;
    const res = await api.post("/users/login", {
      username,
      password
    });
    localStorage.setItem("token", res.data.token);
    drawTodoList();
  });

  // 3. 문서 내부에 삽입하기
  rootEl.textContent = ''
  rootEl.appendChild(fragment);
}

async function drawTodoList() {
  const res = await api.get('/todos')
  const list = res.data

  // 1. 템플릿 복사하기
  const fragment = document.importNode(templates.todoList, true);

  // 2. 내용 채우고 이벤트 리스너 등록하기
  const todoListEl = fragment.querySelector(".todo-list")
  const todoFormEl = fragment.querySelector(".todo-form")
  const logoutBtnEl = fragment.querySelector('.logout')

  todoFormEl.addEventListener('submit', async e => {
    e.preventDefault()
    const body = e.target.elements.body.value
    const res = await api.post('/todos', {
      body,
      complete: false
    })
    if(res.status === 201){
      drawTodoList()
    }
  })

  logoutBtnEl.addEventListener('click', e => {
    e.preventDefault()
    localStorage.removeItem('token')
    drawLoginForm();
  })

  list.forEach(todoItem => {
    // 1. 템플릿 복사하기
    const fragment = document.importNode(templates.todoItem, true);

    // 2. 내용 채우고 이벤트 리스너 등록하기
    const bodyEl = fragment.querySelector(".body");
    const deleteBtnEl = fragment.querySelector('.delete');

    bodyEl.textContent = todoItem.body;

    deleteBtnEl.addEventListener('click', async e => {
      e.preventDefault()
      const res = await api.delete('todos/' + todoItem.id)
      if(res.status === 200){
        drawTodoList()
      }
    })

    // 3. 문서 내부에 삽입하기
    todoListEl.appendChild(fragment);
  });

  // 3. 문서 내부에 삽입하기
  rootEl.textContent = ''
  rootEl.appendChild(fragment)
}

// 만약 로그인을 한 상태라면, 바로 할일목록을 보여주고,
// 아니라면 로그인 폼을 보여준다.

if(localStorage.getItem('token')){
  drawTodoList();
} else {
  drawLoginForm();
}
