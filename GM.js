const canvas = document.getElementById("myCanvas");
let w= window.innerWidth*0.9;
let h=window.innerHeight*0.9;
let defaultSpeed=10; //speed of player
let arrowSpeed=5;  //speed of arrow
let buletSpeed=18;   //speed of bullets
let followSpeed=0; //will be assignned by default speed, initialized to 0
canvas.width=w;
canvas.height=h;
var font = canvas.height*.05+"px Arial";

var ctx=canvas.getContext("2d");
var bulletCollection = [];
var arrowCollection = [];

var updateTimer=0;  //initialized to 0
var bulletCount=0;  //counting numbers of bullet, max. of 10
var arrowCount=8;  //counting numbers of arrow, max. of 10
var bulletMax=20;   //max numbers of bullets

//time interval for shooting bullet
var timeInterval=3;

//player object
function player(){
    this.xcor= w*.5;
    this.ycor= h*.5;
    this.zcor=0;
    this.size= w*.05;
    this.characterColor= "yellow";
    this.outlineColor= "white";
    this.outlinewidth= w/200;
    this.Xspeed= 0;
    this.Yspeed= 0;
    this.life= 10;
    this.mark=0;
    //distance from head of canon to player x/ycor, for bullet shooting purpose
    this.cannonHeadDist = Math.sqrt(3/4*this.size*this.size)+this.size;
    //distance from lx or lr to ycor
    this.y=Math.sqrt(3/4*this.size*this.size);
    //functions
    this.follow=follow;
    this.drawchar=drawchar;
    this.drawcanon=drawcanon;
}
function follow(x,y, speed){ 
    var xdist= Math.abs(x-this.xcor);
    var ydist= Math.abs(y-this.ycor);
    if (x-this.xcor>0)
        this.xcor+=speed*xdist/(xdist+ydist);
    if (x-this.xcor<0)
        this.xcor-=speed*xdist/(xdist+ydist);
    if (y-this.ycor>0)
        this.ycor+=speed*ydist/(xdist+ydist);
    if (y-this.ycor<0)
        this.ycor-=speed*ydist/(xdist+ydist);
    if (xdist<=0 || ydist<=0)
        followSpeed=0;
}

//draw the player
function drawchar(){
    //drawing body of character
    ctx.beginPath();
    ctx.fillStyle = this.characterColor;
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth= this.outlinewidth;
    ctx.arc(this.xcor, this.ycor, this.size, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
}

function drawcanon(){
    //calculate required angle
    let xdiff=mousepoint.mx-this.xcor;
    let ydiff=mousepoint.my-this.ycor; 
    let realAngle=0; //in rad, the true bearing of mouse to player
    let tanAngle=0; //in rad, the tan angle of mouse to player, based on canvas coor./grid

    if (xdiff==0 && ydiff==0){
        realAngle=0;
    }
    else if (xdiff==0){
        if (ydiff>0)
            realAngle=Math.PI;
        if (ydiff<0)
            realAngle=0;
    }
    else if (ydiff==0){
        if (xdiff>0)
            realAngle=Math.PI/2;
        if (xdiff<0)
            realAngle=Math.PI*3/2;
    }
    else{
        tanAngle=Math.atan(ydiff/xdiff);
        if (xdiff>0){
            realAngle=Math.PI/2+tanAngle;
        }
        else if (xdiff<0){
            realAngle=tanAngle+Math.PI*3/2;
        }
    }
    //save player's rotation
    this.zcor=realAngle;

    //define canon drawing coordinates
    let lx = this.xcor-this.size/2;
    let rx= this.xcor+this.size/2;
    let y = this.ycor-this.y;
    ctx.beginPath();

    //rotation matrix
    ctx.translate(this.xcor, this.ycor);
    ctx.rotate(realAngle);
    ctx.translate(-this.xcor, -this.ycor);

    //draw canon
    ctx.beginPath();
    ctx.strokeStyle="black";
    ctx.moveTo(lx,y);
    ctx.lineTo(lx,y-this.size/2);
    ctx.lineTo(rx,y-this.size/2);
    ctx.lineTo(rx,y);
    ctx.lineTo(rx, y);
    ctx.lineWidth=5;
    //draw canon stroke and fill
    ctx.stroke();
    ctx.fillStyle="black";
    ctx.fill();
    ctx.closePath();

    //recover the rotation coordinates
    ctx.translate(this.xcor, this.ycor);
    ctx.rotate(-realAngle);
    ctx.translate(-this.xcor, -this.ycor);
}

//mouse click position
mouse ={
    mx: 0, my:0
};

//mouse point position
mousepoint ={
    mx:0, my:0
};

//arrow object : **Xspeed Yspeed are in CARTESSIAN COOR.**
function arrow(xcor, ycor, Xspeed, Yspeed, size){
    this.xcor=xcor;
    this.ycor=ycor;
    this.size=size; //half of the total width of triangle
    this.r=this.size*2; //from tip to rotation point, i.e. height of triangle
    this.Xspeed=Xspeed;
    this.Yspeed=Yspeed;
    this.destroy=false; //turn true when touched the player
    this.shootAngle=Math.atan(this.Yspeed/this.Xspeed);
    if (this.shootAngle<0){
        this.shootAngle+=Math.PI;
    }

    this.xtip=this.r*Math.sin(this.shootAngle)+this.xcor;           //tip of the arrow for collision detecction
    this.ytip=this.ycor+this.r-this.r*Math.cos(this.shootAngle);    //tip of the arrow for collision detecction
    this.x1tip=this.r/2*Math.cos(this.shootAngle)+this.xcor;        //tip of right vertex
    this.y1tip=this.r/2*Math.sin(this.shootAngle)+this.ycor;
    this.x2tip=-this.r/2*Math.cos(this.shootAngle)+this.xcor;       //tip of left vertex
    this.y2tip=-this.r/2*Math.sin(this.shootAngle)+this.ycor;
    
    this.initialized=false;
    this.initArrow=drawArrow; 
    this.moveArrow=updateArrow;
    this.detectBullet=triXbullet;
    
}
function updateArrow(){
    //cal. shootAngle base on speed
    let angle=Math.atan(this.Yspeed/this.Xspeed);
    if (this.Xspeed>0){
        this.shootAngle=Math.PI/2-angle;
    }
    else if (this.Xspeed<0){
        this.shootAngle=Math.PI*3/2-angle;
    }
    else if (this.Xspeed==0){
        if (this.Yspeed>0)
            this.shootAngle=0;
        if (this.Yspeed<0)
            this.shootAngle=Math.PI;
        if (this.Yspeed==0)
            this.shootAngle=0;
    }
    //move forward
    this.xcor+=this.Xspeed;
    this.ycor-=this.Yspeed;
   
    //cal. the xtip, ytip after rotation
    this.xtip=this.r*Math.sin(this.shootAngle)+this.xcor;           //tip of the arrow for collision detecction
    this.ytip=this.ycor+this.r-this.r*Math.cos(this.shootAngle);    //tip of the arrow for collision detecction
    this.x1tip=this.r/2*Math.cos(this.shootAngle)+this.xcor;        //tip of right vertex
    this.y1tip=this.r/2*Math.sin(this.shootAngle)+(this.ycor+this.r);
    this.x2tip=-this.r/2*Math.cos(this.shootAngle)+this.xcor;       //tip of left vertex
    this.y2tip=-this.r/2*Math.sin(this.shootAngle)+(this.ycor+this.r);

    //bounce back when hit the wall
    if (this.xtip>canvas.width){
        this.xtip=canvas.width-5;
        this.Xspeed=-Math.abs(this.Yspeed);
    }
    if (this.ytip>canvas.height){
        this.ytip=canvas.height-5;
        this.Yspeed=Math.abs(this.Yspeed);
        
    }
    if (this.ytip<0){
        this.ytip=5;
        this.Yspeed=-Math.abs(this.Yspeed);
    }
    if (this.xtip<0){
        this.xtip=5;
        this.Xspeed=Math.abs(this.Yspeed);
    }
    
    //destroy itself when touch the player, collision detection
    if (Math.sqrt((player.xcor-this.xtip)*(player.xcor-this.xtip)+(player.ycor-this.ytip)*(player.ycor-this.ytip))<=(player.size+player.outlinewidth)){
        this.destroy=true;
        player.life--;
    }
}

function drawArrow(){
    ctx.beginPath();
    ctx.strokeStyle="red";
    ctx.lineWidth=this.size/10;

    //rotation matrix
    ctx.translate(this.xcor, this.ycor+this.size*2);
    ctx.rotate(this.shootAngle);
    ctx.translate(-this.xcor, -this.ycor-this.size*2);

    ctx.moveTo(this.xcor,this.ycor);
    ctx.lineTo(this.xcor-this.size,this.ycor+this.size*2);
    ctx.lineTo(this.xcor+this.size,this.ycor+this.size*2);
    ctx.lineTo(this.xcor,this.ycor);
    ctx.stroke();
    ctx.closePath();

    //recover the rotation coordinates
    ctx.translate(this.xcor, this.ycor+this.size*2);
    ctx.rotate(-this.shootAngle);
    ctx.translate(-this.xcor, -this.ycor-this.size*2); 
}

//take in the two coordinate of the bullet
//i.e. (a,b), (c,d), represent the line of bullet
//will only check the two lnogest line of the bullet
function triXbullet(a,b,c,d){
    var tf= lineCol(a,b,c,d,this.xtip,this.ytip,this.x1tip,this.y1tip) || lineCol(a,b,c,d,this.x1tip,this.y1tip,this.x2tip,this.y2tip)|| lineCol(a,b,c,d,this.xtip,this.ytip,this.x2tip,this.y2tip);
    //console.log(lineCol(a,b,c,d,this.xtip,this.ytip,this.x1tip,this.y1tip), lineCol(a,b,c,d,this.x1tip,this.y1tip,this.x2tip,this.y2tip), lineCol(a,b,c,d,this.xtip,this.ytip,this.x2tip,this.y2tip));
    //console.log(a,b,c,d);
    if (tf){
        console.log('hit');
        this.destroy=true;
        player.mark+=10;

    }
    
}

//bullet object
function bullet(xcor, ycor, shootAngle){
    this.speed=buletSpeed;
    this.length=player.size*.5;
    this.width=player.size*.1;
    
    //shoorAngle in radian
    this.shootAngle=shootAngle;
    //left upper corner, center of rotation
    this.xcor=xcor;
    this.ycor=ycor;
    //left bottom corner after rotation
    this.xbot=-this.length*Math.sin(this.shootAngle)+this.xcor;
    this.ybot=this.length*Math.cos(this.shootAngle)+this.ycor;

    //functions
    this.initialized =false;
    this.initBullet = drawBullet;
    this.moveBullet = updateLocation;
}
function updateLocation(){
    this.ycor-=Math.cos(this.shootAngle)*this.speed;
    this.xcor+=Math.sin(this.shootAngle)*this.speed;
    this.xbot=-this.length*Math.sin(this.shootAngle)+this.xcor;
    this.ybot=this.length*Math.cos(this.shootAngle)+this.ycor;    
}
function drawBullet(){

    //rotation matrix
    ctx.translate(this.xcor, this.ycor);
    ctx.rotate(this.shootAngle);
    ctx.translate(-this.xcor, -this.ycor);

    //draw the bullet
    ctx.beginPath();
    ctx.strokeStyle="white";
    ctx.fillStyle="silver";
    ctx.lineWidth=this.width/2;
    ctx.moveTo(this.xcor, this.ycor);
    ctx.lineTo(this.xcor+this.width, this.ycor);
    ctx.lineTo(this.xcor+this.width, this.ycor+this.length);
    ctx.lineTo(this.xcor, this.ycor+this.length);
    ctx.lineTo(this.xcor, this.ycor);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();

    //recover the rotation coordinates
    ctx.translate(this.xcor, this.ycor);
    ctx.rotate(-this.shootAngle);
    ctx.translate(-this.xcor, -this.ycor);
}

//check the collision between two line segments (a,b)(c,d) and (e,f)(g,h)
function lineCol(a,b,c,d,e,f,g,h){
    //slope of abcd and efgh equations
    let M1=(b-d)/(a-c);
    let M2=(f-h)/(e-g);
    //won't collside if two lines parallel
    if (M1==M2)
        return false;
    //cal x,y-intercept point
    let xint=(a*M1-e*M2+f-b)/(M1-M2);
    let yint=M1*(xint-a)+b;
    //see if its within the line secment, **y-coor. are reversed in canvas**
    if ((xint<=Math.max(a,c)) && (xint>=Math.min(a,c)) && (xint<=Math.max(e,g)) && (xint>=Math.min(e,g)) && (yint<=Math.max(b,d)) && (yint>=Math.min(b,d)) && (yint<=Math.max(f,h)) && (yint>=Math.min(f,h)))
        return true;
    return false;
}

console.log(lineCol(1,9,4,7,2,5,3,10));


//listen mouse click
window.addEventListener("click", event=>{
    mouse.mx = event.clientX;     // Get the horizontal coordinate
    mouse.my = event.clientY;     // Get the vertical coordinate
    followSpeed=defaultSpeed;
    //console.log(mouse.mx, mouse.my);
})

//lisiten mouse position
window.addEventListener("mousemove", event=>{
    mousepoint.mx = event.clientX;     // Get the horizontal coordinate
    mousepoint.my = event.clientY;     // Get the vertical coordinate
    //console.log(mousepoint.mx, mousepoint.my);
})


player = new player();
//update the animation
endedgame=true;
answer = confirm('click the arrow keys to play the game\n move your mouse to adjust the shooting angle');
if (answer || !(answer)){
    endedgame=false;
}
function update(){
    //clear
    ctx.clearRect(0,0, canvas.width, canvas.height);
    if (player.life==0){
        endedgame=true;
    }

    //spawn bullet over a time interval
    updateTimer++;
    if (updateTimer>=timeInterval){
        updateTimer-=timeInterval;
        //initialized position = head of the canon
        bulletCollection[bulletCount]=new bullet(player.xcor+player.cannonHeadDist*Math.sin(player.zcor),player.ycor-player.cannonHeadDist*Math.cos(player.zcor),player.zcor);

        bulletCount++;
        if (bulletCount>=bulletMax)
            bulletCount-=bulletMax;
        //console.log(bulletCount);
    }

    //draw bullets
    for (let i=0; i<bulletCollection.length; i++){
        if (!bulletCollection[i].initialized){
            bulletCollection[i].initBullet();
            bulletCollection[i].initialized=true;
        }
        else{
            bulletCollection[i].initBullet();
            bulletCollection[i].moveBullet();
        }
    } 

    //spawning arrows
    for (let i=0; i<arrowCount; i++){
        //initialize all arrows need
        //axis: 0=top, 1=left, 2=right, 3=bottom
        let axis =  Math.floor(Math.random()*4);
        //let axis=3;
        var spawnLocationX;
        var spawnLocationY;
        if (axis==0){
            spawnLocationX = parseInt(Math.random()*(canvas.width-10))+5;
            spawnLocationY = 5;
        }
        if (axis==1){
            spawnLocationX = 5;
            spawnLocationY = parseInt(Math.random()*(canvas.height-10))+5;
        }
        if (axis==2){
            spawnLocationX = canvas.width-5;
            spawnLocationY = parseInt(Math.random()*(canvas.height-10))+5;
        }
        if (axis==3){
            spawnLocationX = parseInt(Math.random()*(canvas.width-10))+5;
            spawnLocationY = canvas.height-5;
        }
        
        //portion of speedX, speedY
        var speedPortion = Math.random()*(.75-.25)+ .25;
        //determine whether 1 or -1
        var plusOrMinusX = Math.random() < 0.5 ? -1 : 1;
        var plusOrMinusY = Math.random() < 0.5 ? -1 : 1;
        //cal. init speed
        var initSpeedX = plusOrMinusX *speedPortion *arrowSpeed;
        var initSpeedY = plusOrMinusY *(1-speedPortion)*arrowSpeed;

        if (arrowCollection[i]==null){
            arrowCollection[i]= new arrow(spawnLocationX, spawnLocationY, initSpeedX, initSpeedY, player.size/5);
        }
        //replace those destroyed
        if (arrowCollection[i].destroy==true){
            arrowCollection[i]= new arrow(spawnLocationX, spawnLocationY, initSpeedX, initSpeedY, player.size/5);
        }
        //update all arrow's position
        if (arrowCollection[i]!=null){
            arrowCollection[i].initArrow();
            arrowCollection[i].moveArrow(); 
        }
    } 

    //detect arrows and bullets collisions
    for (let i=0; i<bulletCollection.length; i++){
        for (let j=0; j<arrowCollection.length; j++){
            arrowCollection[j].detectBullet(bulletCollection[i].xcor, bulletCollection[i].ycor, bulletCollection[i].xbot, bulletCollection[i].ybot);
        }
    }
    
    
    //update player position base on key input
    player.xcor+=player.Xspeed;
    player.ycor+=player.Yspeed;
    

    //can't run out of the canvus
    if (player.xcor+player.size+player.outlinewidth/2>canvas.width){
        player.xcor=canvas.width-player.size-player.outlinewidth/2;
    }
    if (player.ycor+player.size+player.outlinewidth/2>canvas.height){
        player.ycor=canvas.height-player.size-player.outlinewidth/2;
    }
    //drawing of character related to 0, so can use  <0, >0
    if ((player.ycor-player.size-player.outlinewidth/2)< 0){
        player.ycor=player.size+player.outlinewidth/2;
    }
    if ((player.xcor-player.size-player.outlinewidth/2)<0){
        player.xcor=player.size+player.outlinewidth/2;
    }

    
    //draw player and canon
    player.drawcanon();
    player.drawchar();
    player.follow(mouse.mx,mouse.my,followSpeed);

    //show mark and life of player
    ctx.font = font;
    ctx.fillStyle = "black";
    ctx.fillText("Life:"+player.life,w*.03,h*.1);
    ctx.fillText("Points:"+player.mark,w*.03,h*.1+h*.05+h*.01);

    /*
    if (bulletCollection[0]){
        ctx.beginPath();
        ctx.lineWidth=1;
        ctx.strokeStyle = 'blue';
        ctx.moveTo(bulletCollection[0].xbot,bulletCollection[0].ybot);
        ctx.lineTo(0, 0);
        ctx.moveTo(bulletCollection[0].xcor,bulletCollection[0].ycor);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.closePath();
        //console.log(bulletCollection[0].xcor);
    }

    if (arrowCollection[0]){
        ctx.beginPath();
        ctx.lineWidth=1;
        ctx.strokeStyle = 'blue';
        ctx.moveTo(arrowCollection[0].xtip,arrowCollection[0].ytip);
        ctx.lineTo(0, 0);
        ctx.moveTo(arrowCollection[0].x1tip,arrowCollection[0].y1tip);
        ctx.lineTo(0, 0);
        ctx.moveTo(arrowCollection[0].x2tip,arrowCollection[0].y2tip);
        ctx.lineTo(0, 0);

        ctx.stroke();
        ctx.closePath();
        //console.log(bulletCollection[0].xcor);
    }
    */    
    
    if (!endedgame){
        requestAnimationFrame(update);
    }
    else{
        answer = confirm('No life left! Your mark is '+player.mark+'\nClick ok to play again~');
        if (answer){
            endedgame=false;
            player.mark=0;
            player.life=10;
            arrowCollection=[];
            requestAnimationFrame(update);

        }
    }
}



//moving with 
function moveUp(){
    player.Yspeed=-defaultSpeed;
}
function moveDown(){
    player.Yspeed=defaultSpeed;
}
function moveLeft(){
    player.Xspeed=-defaultSpeed;
}
function moveRight(){
    player.Xspeed=defaultSpeed;
}

function nomoveUp(){
    player.Yspeed=0;
}
function nomoveDown(){
    player.Yspeed=0;
}
function nomoveLeft(){
    player.Xspeed=0;
}
function nomoveRight(){
    player.Xspeed=0;
}

window.addEventListener('keydown', event =>{
    //if up arrow
    if (event.which ==38 ){
        moveUp();
    }
    //if down arrow
    if (event.which ==40 ){
        moveDown();
    }
    //if left arrow
    if (event.which ==37 ){
        moveLeft();
    }
    //if right arrow
    if (event.which ==39 ){
        moveRight();
    }
})

window.addEventListener('keyup', event =>{
    //if up arrow
    if (event.which ==38 ){
        nomoveUp();
    }
    //if down arrow
    if (event.which ==40 ){
        nomoveDown();
    }
    //if left arrow
    if (event.which ==37 ){
        nomoveLeft();
    }
    //if right arrow
    if (event.which ==39 ){
        nomoveRight();
    }
})

/*testing
ctx.beginPath();

//transform matrix
ctx.translate(50,100);
ctx.rotate(60*Math.PI/180);
ctx.translate(-50,-100);

ctx.moveTo(50,100);
ctx.lineTo(100,100);
ctx.lineTo(75,125);
ctx.lineWidth=5;


ctx.stroke();
ctx.closePath();
end*/


update();
