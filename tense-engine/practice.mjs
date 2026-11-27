// Objects and complements are curated separately for each verb.
const lexicon = `
be|was|is|at the gate;ready for lunch;in the library;on the bus;by the window;at the park
can|could|can|swim across the pool;hear the drums;read the sign;play the tune;see the lake;carry the box
do|did|does|the dishes;a word puzzle;the laundry;a drawing exercise;the shopping;a science project
go|went|goes|to the library;to the park;down the path;to the pool;across the field;up the stairs
have|had|has|a red backpack;a spare pencil;a new book;a big lunch;a good idea;a small tent
play|played|plays|soccer after school;chess at lunch;the drums;cards with friends;the piano;tennis at the park
finish|finished|finishes|the last chapter;a science poster;the puzzle;lunch before the bell;the drawing;the race
get|got|gets|a ticket for the show;a map at the gate;a snack at lunch;a seat by the window;a letter from camp;a new notebook
say|said|says|hello to the coach;thank you for the ride;goodbye at the gate;sorry for the mess;good morning to the teacher;thank you for the gift
need|needed|needs|a longer rope;a new pencil;more time;a map of the park;some blue paint;a bigger box
eat|ate|eats|rice for lunch;a banana before practice;noodles at home;a slice of mango;toast for breakfast;an apple at recess
drink|drank|drinks|water after practice;milk at breakfast;juice at lunch;tea with dinner;cold water on the hike;lemonade at the picnic
run|ran|runs|to the gate;around the track;past the library;up the hill;along the beach;across the field
walk|walked|walks|along the path;to the market;across the bridge;around the lake;past the shop;through the park
come|came|comes|to the picnic;home before dinner;back after lunch;to the concert;through the front gate;to the library
see|saw|sees|a kite in the sky;a frog by the pond;a bird in the tree;a boat on the river;a shell in the sand;a crab on the beach
look|looked|looks|at the map;through the window;under the bench;inside the bag;across the lake;at the scoreboard
find|found|finds|a lost scarf;a shiny stone;a shortcut home;a bird’s nest;a coin under the bench;a note in the book
make|made|makes|a paper boat;a clay bowl;a birthday card;a fruit salad;a toy plane;a model bridge
take|took|takes|a photo of the lake;a bus to school;a break after lunch;a notebook to class;a shortcut through the park;a bottle of water
give|gave|gives|the dog a treat;the coach a card;the team a clue;the guide a map;the teacher a note;the driver a ticket
bring|brought|brings|a snack to camp;a ball to the park;a jacket on the hike;a book to class;a towel to the pool;a gift to the party
buy|bought|buys|fruit at the market;a ticket at the gate;a pen at the shop;a snack after school;bread at the bakery;a postcard for a friend
think|thought|thinks|about the puzzle;of a new plan;about the trip;of a better name;about the ending;of a question
know|knew|knows|the answer;the way home;the rules of chess;the last line;the secret code;the name of the river
tell|told|tells|a funny story;the team a secret;the class a joke;the guide the address;the coach the score;the teacher the answer
write|wrote|writes|a letter home;a note to the coach;a poem about rain;a story about a fox;a list for camp;a name on the card
draw|drew|draws|a map of the park;a picture of the lake;a fox under a tree;a boat on the river;a plan for the bridge;a dragon in the sky
read|read|reads|a comic on the bus;a letter from camp;a poem at school;the sign at the gate;a story at bedtime;the menu at lunch
speak|spoke|speaks|to the coach;at the assembly;to the guide;in a quiet voice;to a visitor;at the meeting
hear|heard|hears|a whistle outside;the bell at school;a frog by the pond;music in the hall;a dog at the gate;rain on the roof
feel|felt|feels|proud after the race;happy at camp;nervous on stage;safe at home;tired after swimming;calm by the lake
leave|left|leaves|school after lunch;the park before dark;a note at the gate;the bag on the bus;the tent at dawn;the room quietly
put|put|puts|a book on the shelf;a coin in the jar;a card in the box;the keys on the hook;the bag by the door;a note on the desk
sit|sat|sits|next to the window;on the front step;under a tree;by the lake;near the door;beside the coach
stand|stood|stands|by the gate;near the stage;under the shelter;beside the tree;in the front row;behind the bench
sleep|slept|sleeps|in a tent;on the bus;under a blanket;beside the campfire;on the sofa;through the storm
wake|woke|wakes|up before sunrise;up to the sound of rain;up after a nap;up early for school;up at the campsite;up before the alarm
swim|swam|swims|across the pool;near the shore;under the bridge;with the team;to the steps;along the beach
ride|rode|rides|a bike to school;a horse on the trail;a scooter at the park;the train into town;the bus to camp;a bike along the canal
build|built|builds|a sandcastle;a model airplane;a bridge from sticks;a tower of blocks;a shelter at camp;a birdhouse
help|helped|helps|the coach after practice;a friend with homework;the guide with the bags;the team after lunch;a neighbor in the garden;the teacher after class
ask|asked|asks|for a pencil;for directions;about the next train;the guide a question;for another turn;about the missing book
want|wanted|wants|another turn;a new book;a quiet seat;some water;a ticket for the show;a bigger paintbrush
start|started|starts|a new chapter;the race on time;a chess club;a drawing after lunch;a new puzzle;the lesson early
watch|watched|watches|a bird in the garden;the match at home;the parade from the bridge;a film after dinner;the boats on the lake;the clouds above the hill
listen|listened|listens|to the rain;to the coach;to the morning news;to the birds;to the story;to the school band
learn|learned|learns|a new song;the rules of chess;a new word;the steps of a dance;the names of the planets;a poem by heart
win|won|wins|the first race;a game of chess;a prize at the fair;the relay;a ticket in the raffle;the spelling contest
lose|lost|loses|a pencil at school;a scarf on the bus;the first game;a key at the park;a mitten in the snow;a map on the trail
`.trim().split('\n').map(line=>line.split('|'));
export const practiceVerbs = lexicon.map(row=>row[0]);
const subjects=['I','you','he','she','we','they','my cousin','the players'];
const caps=s=>s[0].toUpperCase()+s.slice(1);
const subInQuestion=s=>s==='I'?'I':s;
export const tiers=[['Purple',3,'#cc91ff'],['Gold',5,'#ffcd54'],['Green',8,'#68dc91'],['Blue',12,'#6dbbff'],['Yellow',18,'#f2ed74'],['Orange',26,'#ffa35e'],['Red',Infinity,'#ff716b']];
export function rank(samples=[]){
 if(!samples.length)return {name:'New',color:'#9daaa5',mean:null};
 const recent=samples.slice(-7),mean=recent.reduce((n,v)=>n+v,0)/recent.length/1000;
 const [name,,color]=tiers.find(t=>mean<=t[1]);return {name,color,mean};
}
const norm=s=>s.toLowerCase().replace(/[’‘]/g,"'").trim().replace(/\s+/g,' ').replace(/[.!?]+$/,'');
export function matches(answer,allowed){return allowed.some(s=>norm(s)===norm(answer))}
export function practiceItems(verb){
 const row=lexicon.find(x=>x[0]===verb);if(!row)return [];
 const [,past,third,objects]=row,items=[];
 for(const [si,sub] of subjects.entries())for(const [oi,obj] of objects.split(';').entries()){
  const singular=[2,3,6].includes(si),subject=caps(sub),be=si===0?'am':singular?'is':'are',was=si===0||singular?'was':'were';
  const add=(type,now,gap,answers)=>items.push({id:verb+'-'+si+'-'+oi+'-'+type,now,gap,answers});
  if(verb==='be'){
   add('a',subject+' '+be+' '+obj+'.',subject+' ___ '+obj+'.',[was]);
   add('n',subject+' '+be+' not '+obj+'.',subject+' ___ '+obj+'.',[was+' not',was+"n't"]);
   add('q',caps(be)+' '+subInQuestion(sub)+' '+obj+'?','___ '+subInQuestion(sub)+' '+obj+'?',[was]);
   const action=['reading a comic','waiting for a friend','drawing a map','playing cards','looking for shells','writing a story'][oi];
   add('p',subject+' '+be+' '+action+'.',subject+' ___ '+action.split(' ').slice(1).join(' ')+'.',[was+' '+action.split(' ')[0]]);
  }else if(verb==='can'){
   const [base,...rest]=obj.split(' '),tail=rest.join(' ');
   add('a',subject+' can '+obj+'.',subject+' ___ '+tail+'.',['could '+base]);
   add('n',subject+" can't "+obj+'.',subject+' ___ '+tail+'.',["couldn't "+base,'could not '+base]);
   add('q','Can '+subInQuestion(sub)+' '+obj+'?','___ '+subInQuestion(sub)+' '+obj+'?',['could']);
  }else{
   add('a',subject+' '+(singular?third:verb)+' '+obj+'.',subject+' ___ '+obj+'.',[past,...(verb==='learn'?['learnt']:[])]);
   add('n',subject+' '+(singular?"doesn't":"don't")+' '+verb+' '+obj+'.',subject+' ___ '+obj+'.',["didn't "+verb,'did not '+verb]);
   add('q',(singular?'Does':'Do')+' '+subInQuestion(sub)+' '+verb+' '+obj+'?','Did '+subInQuestion(sub)+' ___ '+obj+'?',[verb]);
  }
 }
 return items;
}
export function nextItem(verb,recent=[]){
 const all=practiceItems(verb),used=new Set(recent);
 const fresh=all.filter(q=>!used.has(q.id)),pool=fresh.length?fresh:all;
 const last=String(recent.at(-1)||'').split('-');
 const mixed=pool.filter(q=>{const parts=q.id.split('-');return last[2]!==parts[2]&&last[1]!==parts[1]&&last[3]!==parts[3]});
 const choices=mixed.length?mixed:pool;
 return choices[Math.floor(Math.random()*choices.length)];
}
