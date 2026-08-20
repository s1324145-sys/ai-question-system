const $=s=>document.querySelector(s),messages=$('#messages'),input=$('#chatInput'),send=$('#sendButton');
messages.style.minHeight='0';document.querySelector('.chat-shell').style.minHeight='0';document.querySelector('.composer').style.flexShrink='0';
let step=0,answers=[],currentData=null;
const questions=[
  '教えてくれてありがとうございます。もう少し状況を知りたいです。いつ、どんな作業をしているときに困りましたか？',
  'なるほど、状況が見えてきました。解決するために、すでに調べたり試したりしたことはありますか？',
  '最後にひとつだけ。いちばん引っかかっているのは「やり方」「判断基準」「失敗への不安」のどれに近いですか？'
];
function time(){return new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}
function scroll(){messages.scrollTo({top:messages.scrollHeight,behavior:'smooth'})}
function bubble(text,type='ai') {const el=document.createElement('div');el.className=`message ${type}`;el.innerHTML=type==='ai'?`<span class="ai-avatar">✦</span><div><p>${text}</p><time>${time()}</time></div>`:`<div><p>${text}</p><time>${time()}　✓</time></div>`;messages.append(el);scroll()}
function typing(){const el=document.createElement('div');el.className='message ai typing';el.innerHTML='<span class="ai-avatar">✦</span><div><p>•••</p></div>';messages.append(el);scroll();return el}
function updateProgress(){const n=Math.min(step+1,4);$('#meter').style.width=`${n*25}%`;const labels=['いまの状況を聞いています','試したことを確認中','困っている点を確認中','整理できました'];$('#progressText').textContent=labels[n-1];document.querySelectorAll('.guide li').forEach((li,i)=>{li.classList.toggle('current',i===n-1);li.classList.toggle('done',i<n-1)})}
function analyze(){const all=answers.join(' '),topic=all.match(/(経費|交通費|申請|会議|資料|システム|顧客|メール|業務|作業|設定)/)?.[0]||'いまの業務';return{core:`${topic}で判断のよりどころが曖昧になっている`,facts:`${answers[0]||'状況を確認中'}\n作業を前に進めたいと思っている`,unknown:`自分のケースでの正しい進め方\nどの基準で判断すればよいか`,tried:answers[2]||'まだ試したことは整理できていない',next:`${topic}の判断基準を確認し、自分のケースに当てはめる`}}
function showAnalysis(){const data=currentData=analyze(),card=$('#analysisTemplate').content.cloneNode(true);const output={core:data.core,facts:data.facts,unknown:data.unknown,tried:data.tried,nextAction:data.next};Object.entries(output).forEach(([id,text])=>{const target=card.querySelector(`#${id}`);if(target)target.textContent=text});messages.append(card);const result=messages.lastElementChild;result.querySelector('#copyResult').onclick=async()=>{try{await navigator.clipboard.writeText(summaryText(data));toast('整理結果をコピーしました')}catch{toast('コピーできませんでした')}};result.querySelector('#saveResult').onclick=()=>{localStorage.setItem('totonou-chat',JSON.stringify({answers,data,date:new Date()}));toast('整理結果を記録しました')};result.querySelector('#openEmail').onclick=openEmail;result.querySelector('#openDatabase').onclick=openDatabase;requestAnimationFrame(()=>result.scrollIntoView({behavior:'smooth',block:'start'}))}
function summaryText(d){return `悩みの中心：${d.core}\n\nわかっていること：\n${d.facts}\n\nまだ分からないこと：\n${d.unknown}\n\n試したこと：\n${d.tried}\n\n次の一歩：${d.next}`}
function openEmail(){const d=currentData||analyze();$('#mailSubject').value=`【確認】${d.core}`;$('#mailBody').value=`田中さん\n\nお疲れさまです。以下について確認させてください。\n\n【悩みの中心】\n${d.core}\n\n【現在わかっていること】\n${d.facts}\n\n【まだ分からないこと】\n${d.unknown}\n\n【自分で試したこと】\n${d.tried}\n\nお手すきの際に、判断方法をご教示いただけると助かります。\nよろしくお願いいたします。`;openPage('emailPage')}
function openDatabase(){const d=currentData||analyze();$('#searchQuery').textContent=d.core;$('#databaseResult').classList.add('hidden');$('#databaseSearch').style.display='block';openPage('databasePage')}
function openPage(id){document.querySelectorAll('.route-page').forEach(p=>p.classList.remove('open'));$(`#${id}`).classList.add('open')}
async function submit(text){if(!text.trim()||send.disabled)return;document.querySelector('#suggestions')?.remove();bubble(text.trim(),'user');answers.push(text.trim());input.value='';input.style.height='auto';const wait=typing();send.disabled=true;try{await new Promise(r=>setTimeout(r,650));wait.remove();if(step<questions.length){bubble(questions[step]);step++;updateProgress()}else{step=4;updateProgress();bubble('ありがとうございます。会話の内容を整理できました。','ai');showAnalysis()}}catch(error){console.error(error);wait.remove();bubble('整理処理で問題が起きました。もう一度「分析して」と送ってください。','ai')}finally{send.disabled=false;input.focus()}}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
send.onclick=()=>submit(input.value);input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(input.value)}});input.addEventListener('input',()=>{input.style.height='auto';input.style.height=`${Math.min(input.scrollHeight,100)}px`});
document.querySelectorAll('.suggestions button').forEach(b=>b.onclick=()=>submit(b.textContent));
$('#newChat').onclick=()=>location.reload();
$('#analyzeNow').onclick=()=>{if(!answers.length){toast('まずは悩みをひとつ送ってください');return}step=4;updateProgress();bubble('ここまでの会話を整理しました。','ai');showAnalysis()};
document.querySelectorAll('.backChat').forEach(button=>button.onclick=()=>document.querySelectorAll('.route-page').forEach(page=>page.classList.remove('open')));
$('#sendMail').onclick=()=>{toast(`${$('#mailTo').value}へ確認メールを送りました`);setTimeout(()=>document.querySelectorAll('.route-page').forEach(page=>page.classList.remove('open')),900)};
$('#databaseSearch').onclick=async()=>{const button=$('#databaseSearch');button.disabled=true;button.textContent='社内マニュアルと過去事例を検索中…';await new Promise(resolve=>setTimeout(resolve,1100));const d=currentData||analyze();$('#answerTitle').textContent=d.core;$('#databaseAnswer').textContent=`社内マニュアルでは、このケースは「まず対象条件を確認し、例外に該当する場合のみ担当者へ確認する」とされています。\n\n今回の状況では、${d.next}のが適切です。対象条件に当てはまらない、または判断材料が不足している場合は、整理した内容を添えてOJT担当者へ確認してください。`;$('#databaseResult').classList.remove('hidden');button.style.display='none';button.disabled=false;button.textContent='社内データベースを検索する　→'};
$('#askAfter').onclick=openEmail;
$('#recordsNav').onclick=showRecords;
$('#helpNav').onclick=()=>openPage('helpPage');
$('#chatNav').onclick=()=>document.querySelectorAll('.route-page').forEach(page=>page.classList.remove('open'));
document.querySelectorAll('.historyItem').forEach(button=>button.onclick=showRecords);
function showRecords(){const saved=localStorage.getItem('totonou-chat');const list=$('#recordsList');if(saved){const item=JSON.parse(saved);list.innerHTML=`<h3>${item.data.core}</h3><p style="white-space:pre-line;font-size:10px;line-height:1.9">${summaryText(item.data)}</p>`}else{list.innerHTML='<div style="text-align:center;padding:35px;color:#89938f;font-size:10px">まだ保存した記録はありません。<br>分析結果の「この整理を記録する」から保存できます。</div>'}openPage('recordsPage')}
