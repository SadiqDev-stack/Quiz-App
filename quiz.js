const $ = ele => ele.includes('*') ?
  document.querySelectorAll(ele.replace('*', '')) :
  document.querySelector(ele);
  
  
let toClose = false; // for confirmation before closing app
const getId = section => {
  let id;
  Sections.forEach((sect,ind) => sect == section ? id = ind : null);
  return id
}

const sections = {
  histories: [],
  open: function(section){
    const id = getId(section)
    this.histories.push(id);
    Sections.forEach(sect => 
    sect.style.display = sect == section ? "flex" : "none")
  },
  back: function() {
    const lastId = this.histories.at(-1);
    if(lastId !== 0){
      if(lastId == 1){
        if(confirm('Are You Sure To End This Quiz')){
          endQuiz()
        }
      }else if(lastId == 2){
        sections.open(homeSection);
      }
    }else{
      if(confirm('Are You Sure You Want To Exit This App')){
        toClose = true;
        history.back(-1)
      }
    }
  }
}


history.pushState(null,null,location.href)

onpopstate = e => {
  if(!toClose){
    history.pushState(null,null,localStorage.href)
    sections.back()
  }
}

const msgDuration = 3000
const msgDisp = $('.msgDisplay');
const Sections = $('*.section');
const [homeSection,fieldSection,progressSection] = Sections;
const QAmount = homeSection.querySelector('input');
const [QCategory,QDifficulty,QType] = $('*select')
const TakeBtn = $('.takeBtn');
const Timer = $('.timer');
const Question = $('.question');
const Answers = $('.answers');
const EndQuiz = $('.end');
const [Results,Scored,Answered,Recommendation] = progressSection.querySelectorAll('.progresses *');
 
const correctSound = new Audio('correctSound.mp3');
const incorrectSound = new Audio('incorrectSound.mp3');
const tickSound = new Audio('tickSound.mp3')
 
 
sections.open(homeSection) // to open home default

let msgTimer;
const alertMsg = msg => {
  clearTimeout(msgTimer)
  msgDisp.textContent = msg;
  msgDisp.style.animationName = "show";
  const clear = e => {
    msgDisp.style.opacity = 0;
    msgDisp.style.animationName = null
  }
  
  msgTimer = setTimeout(clear,msgDuration)
}

// for quiz form 
let qAmount = 0;
let qCategory = "any";
let qDifficulty = "any";
let qType = "";
const maxQAmount = 50;
let qEndPoint = "https://opentdb.com/api.php?amount=10"
let point = [];
let isValid = true;

addEventListener('submit', e => {
  e.preventDefault();
  isValid ? loadQuiz() : null;
})

const freeze = ele => {
  ele.style.pointerEvents = "none";
}

const unfreeze = ele => {
  ele.style.pointerEvents = "auto";
}


function formLoop(){
  requestAnimationFrame(formLoop);
  // to continue ticking 
  tickSound.currentTime >= tickSound.duration ? tickSound.currentTime = 0 : null
  
  qAmount = QAmount.value;
  if(qAmount > maxQAmount){
    alertMsg("Quetion Amount Must Be Less Than Or Equal To " + maxQAmount);
    isValid = false
  }else{
    isValid = true
  }
  
  qCategory = QCategory.value;
  qDifficulty = QDifficulty.value;
  qType = QType.value;
  
  point = [];
  point.push(`amount=${qAmount}`)
  point.push(`category=${qCategory}`);
  point.push(`difficulty=${qDifficulty}`);
  point.push(`type=${qType}`);;
  
  // to remove any's
  point = point.filter(pt => !pt.includes('any'));
  // constructing url
  qEndPoint = `https://opentdb.com/api.php?${point.join('&')}`
  
}

formLoop()


const loadQuiz = async e => {
  TakeBtn.textContent = "Loading Quiz...";
  freeze(TakeBtn);
  TakeBtn.style.background = "#C3FFAE";
  
  try{
    const qData = await fetch(qEndPoint).then(res => res.json());
    // setting up resources
    if(qData.results.length){
    startQuiz(qData);
    }else{
      throw new Error("Requested Questions Are Not Available In Server")
    }
  }catch(er){
    alertMsg(er.message);
  }finally{
    unfreeze(TakeBtn);
    TakeBtn.textContent = "Take Quiz";
    TakeBtn.style.background = "#56FF2B";
  }
  
}

// for quiz timing
let countDown = 0;
const maxTime = 20
let timer;
let prefix = "M";
let time; 
let qNumber = 0;
let ticking = false;

const startTimer = amount => {
  ticking = false
  countDown = ((amount / maxQAmount) * maxTime) * 60000 // 60k for minute
  // max time is 20minute for 50quetion;
  updateTime(countDown)
  
  timer = setInterval(e => {
    if(countDown > 1000){
    countDown -= 1000
    updateTime(countDown)
    }else{
      endQuiz();
    }
  },1000);
}

const updateTime = countDown => {
   // prefixing depening on time
    if(countDown >= 60000){
      prefix = "M";
      time = Number(countDown / 60000).toFixed(2)
    }else{
      prefix = "S"
      time = Number(countDown / 1000).toFixed(0);
      if(time <= 5){
        !ticking ? play(tickSound) : null
        ticking = true
        Timer.style.animationName = "tick"
      }
    }
    
    Timer.textContent = `${time}${prefix} ⏱️`
}


let qScores = 0;
let answeredQ = 0;
const qChangeDelay = 2;
let qLength = 0;

const startQuiz = quizData => {
  Timer.style.animationName = null;
  Timer.style.transform = "scale(1)";
  Timer.style.color = "white";
  
  sections.open(fieldSection);
  startTimer(qAmount);
  qScores = 0;
  answeredQ = 0;
  
  const answers = [];
  const questions = [];
  qNumber = 0;
  // seperating quetion and answers
  quizData.results.forEach(data => {
    let qAnswer = [];
    const {correct_answer,incorrect_answers,question} = data;
    incorrect_answers.forEach(answer => qAnswer.push({
      isCorrect: (answer == correct_answer),
      content: answer
    }))
    
    qAnswer.push({
      isCorrect: true,
      content: correct_answer
    })
   
   answers.push(qAnswer);
   questions.push(question)
  })
  
  qLength = questions.length
  
  const changeQ = () => {
      Question.innerHTML = questions[qNumber];
      Answers.innerHTML = "";
      answers[qNumber].forEach(ans => {
        Answers.appendChild(createList(ans,changeQ))
      })
  }
  
  changeQ()
  
}


const qRecommendation = {
  Exellent: "You Have Excellent Scores In This Quiz Keep Up Your Good Habit, One Day You Will Suceed",
  Good: "Your Scores Are Good And I Appreciate It, If Possible Try To Be Excellent, Good Luck",
  Poor: "Your Performance Is Poor, But This Happens To Everyone Try To Be Consistent, You Will Be Exellent, Good Luck"
}


const endQuiz = e => {
  clearInterval(timer);
  tickSound.pause();
  
  const percentScored = Math.round((qScores / qLength) * 100);
  
  sections.open(progressSection);
  let result;
  if(percentScored >= 65){
    result = "Exellent"
  }else if(percentScored >= 33){
    result = "Good"
  }else{
    result = "Poor"
  }
  
  Results.textContent = `Result: ${result} Score`;
  Scored.textContent = `Scored: ${percentScored}% of 100`;
  Answered.textContent = `Answered: ${answeredQ} Question`;
  Recommendation.textContent = qRecommendation[result]
}

EndQuiz.onclick = e => {
  if(confirm('Are You Sure To End This Quiz')){
    endQuiz()
  }
}


const createList = (answer,callback) => {
  const list = document.createElement('div');
  list.innerHTML = answer.content;
  list.className = "answer";
  
  list.onclick = e => {
     
    if(answer.isCorrect){
      qScores++
      list.style.background = "#49F35C";
      play(correctSound);
    }else{
      list.style.background = "#F34958";
      Answers.querySelectorAll('*').forEach(ans => {
        const isCorrect = ans.getAttribute("isCorrect");
        isCorrect == "true" ? ans.style.background = "#49F35C" : null
      })
      play(incorrectSound)
    }
    
    freeze(Answers);
    answeredQ++;
    qNumber++
    if (qNumber < qLength) {
      setTimeout(e => {
        callback();
        unfreeze(Answers);
        }, qChangeDelay * 1000)
    } else {
      setTimeout(endQuiz,qChangeDelay * 1000)
    }
  }
  
  list.setAttribute("isCorrect",answer.isCorrect)
  return list
}


const play = (sound,time = 0,volume = 1) => {
  sound.currentTime = time;
  sound.volume = volume;
  sound.play();
}
