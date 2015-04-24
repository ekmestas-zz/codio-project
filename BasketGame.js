//
// Box2D declarations
//

var b2Transform = Box2D.Common.Math.b2Transform
  , b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2BodyDef = Box2D.Dynamics.b2BodyDef
  , b2Body = Box2D.Dynamics.b2Body
  , b2ContactListener = Box2D.Dynamics.b2ContactListener
  , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
  , b2Fixture = Box2D.Dynamics.b2Fixture
  , b2World = Box2D.Dynamics.b2World
  , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
  , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
  , b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

//
// Constants
//

var INPUT_MODE_CURVE = 0;
var INPUT_MODE_CONTROL = 1;
var INPUT_MODE_PLAY = 2;

var CONTROL_RADIUS = 30;
var CONTROL_ID_NONE = 0;
var CONTROL_ID_1 = 1;
var CONTROL_ID_2 = 2;

var UI_MARGIN = 5;
var BASKET_SIZE = 128;
var ICON_SIZE = 64;
var ICON_ID_PLUS = '+';
var ICON_ID_ARROW_PLUS = 'Arrow+';
var ICON_ID_PLAY = 'Play'; 
var ICON_ID_BALL = 'Ball';
var ICON_ID_BASKET = 'Basket';
var FONT_SIZE = '24';

var SCORE_INCREMENT = 100;

var BALL_RADIUS = ICON_SIZE / 2;

var NUM_CURVE_POINTS = 30;

var CATEGORY_PHYSICS_ENTITIES = 0x0001;
var CATEGORY_LOGIC_ENTITIES = 0x0002;

//
// Variables
//

var inputMode = INPUT_MODE_CURVE;
var numInputs = 0;
var selectedControl = CONTROL_ID_NONE;
var numButtons = 0;

var point1X = 0;
var point1Y = 0;
var control1X = 0;
var control1Y = 0;
var point2X = 0;
var point2Y = 0;
var control2X = 0;
var control2Y = 0;
var curvePoints = [];

var basketX = 0;
var basketY = 0;

var score = 0;
var highScore = 0;
var playerScored = false;
var playerHighScored = false;

var world = null;
var ground = null;
var ball = null;
var curve = null;
var basket = null;
var basketSensor = null;
var animating = false;

var canvas = null;
var context = null;

//
// Static drawing helpers
//

function clear(canvas, ctx)
{
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getCurvePoints(points, x1, y1, x2, y2, x3, y3, x4, y4)
{
  for (var i = 0; i < points.length; ++i)
  {
    var t = i / (points.length - 1);
    var t2 = t * t;
    var t3 = t * t2;
    
    var cx = 3 * (x2 - x1);
    var bx = 3 * (x4 - x2) - cx;
    var ax = x3 - x1 - cx - bx;
    var x = t3 * ax + t2 * bx + t * cx + x1;
    var cy = 3 * (y2 - y1);
    var by = 3 * (y4 - y2) - cy;
    var ay = y3 - y1 - cy - by;
    var y = t3 * ay + t2 * by + t * cy + y1;
    
    points[i].x = x;
    points[i].y = -y;
  }
}

function drawCurvePoints(ctx, points)
{
  for (var i = 0; i < points.length; ++i)
  {
    fillCircle(ctx, points[i].x, -points[i].y, 3);
  }
}

function drawCurve(ctx, x1, y1, cx1, cy1, x2, y2, cx2, cy2)
{
  ctx.save();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
  ctx.strokeStyle = 'hsl(10, 50%, 50%)';
  ctx.stroke();
  ctx.restore();
}

function drawCircle(ctx, x, y, r, thickness)
{
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = 'green';
  ctx.lineWidth = thickness;
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function fillCircle(ctx, x, y, r)
{
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = 'green';
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

function pathCircle(ctx, x, y, r)
{
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
}

function drawLine(ctx, x1, y1, x2, y2, color, thickness)
{
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawVerticalDashedLine(ctx, x, y1, y2, numDashes)
{
  var step = (y2 - y1) / numDashes;
  for (var i = 0; i < numDashes; ++i)
  {
    if (i % 2 == 0)
    {
      drawLine(ctx, x, step * i, x, step * (i + 1), 'red', 5);
    }
  }
}

function drawRect(ctx, x, y, w, h, color)
{
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.rect(x, y, w, h);
  ctx.stroke();
  ctx.restore();
}

function getTextSize(ctx, text)
{
  ctx.save();
  ctx.font = FONT_SIZE + 'px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  var textSize = ctx.measureText(text);
  ctx.restore();
  
  return textSize;
}

function fillText(ctx, text, x, y, color)
{
  ctx.save();
  ctx.font = FONT_SIZE + 'px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + 8);
  ctx.restore();
}

function drawImage(ctx, image, x, y, angle)
{
  var imageCenterX = x + image.width / 2;
  var imageCenterY = y + image.height / 2;
  
  ctx.save();
  ctx.translate(imageCenterX, imageCenterY);
  ctx.rotate(angle);
  ctx.translate(-imageCenterX, -imageCenterY);
  ctx.drawImage(image, x, y);
  ctx.restore();
}

//
// Game drawing methods
//

function drawControl(paint, x, y, cx, cy, pressed)
{
  if (isPointInToolbar(x, y))
  {
    return;
  }
  
  if (pressed)
  {
    drawCircle(context, cx, cy, CONTROL_RADIUS, 5);
  }
  else
  {
    drawCircle(context, cx, cy, CONTROL_RADIUS, 1);
  }
  
  drawLine(context, x, y, cx, cy, 'green', 1);
}

function drawImageButton(buttonID, buttonImageID, pressed)
{
  var imageID = buttonImageID;
  if (pressed)
  {
    imageID += 'Pressed';
  }
  imageID += '_img';
  var image = document.getElementById(imageID);
  drawImage(context, image, UI_MARGIN, UI_MARGIN + buttonID * ICON_SIZE, 0);
}

function drawBall()
{
  if (!ball)
  {
    return;
  }
  
  var positionVec = ball.GetPosition();
  var image = document.getElementById(ICON_ID_BALL + '_img');
  
  drawImage(context, image, positionVec.x - BALL_RADIUS, -positionVec.y - BALL_RADIUS, -ball.GetAngle());
}

function drawBasketArea()
{
  var image = document.getElementById(ICON_ID_BASKET + '_img');
  drawImage(context, image, basketX, basketY);
  drawVerticalDashedLine(context, basketX - UI_MARGIN, 0, canvas.height, 20);
}

function draw()
{
  clear(canvas, context);
  
  if (!isPointInToolbar(control2X, control2Y))
  {
    drawCurve(context, point1X, point1Y, control1X, control1Y, point2X, point2Y, control2X, control2Y);
    drawCurvePoints(context, curvePoints);
  }
  
  switch (inputMode)
  {
    case INPUT_MODE_CONTROL:
    {
      if (!isPointInToolbar(control2X, control2Y))
      {
        drawControl(true, point1X, point1Y, control1X, control1Y, selectedControl == CONTROL_ID_1);
        drawControl(true, point2X, point2Y, control2X, control2Y, selectedControl == CONTROL_ID_2);
      }
      break;
    }
    case INPUT_MODE_PLAY:
    {
      if (ball && !isPointInToolbar(ball.GetPosition().x, -ball.GetPosition().y))
      {
        drawBall();
      }
    }
  }
  
  drawBasketArea();
  
  fillText(context, 'Score: ' + score, 20, canvas.height - 40, 'black');
  fillText(context, 'High Score: ' + highScore, 20, canvas.height - 80, 'black');
  
  if (playerHighScored)
  {
    var textSize = getTextSize(context, 'High Score!');
    drawRect(context, canvas.width / 2 - 5, canvas.height - 90, textSize.width + 10, 40, 'blue');
    fillText(context, 'High Score!', canvas.width / 2, canvas.height - 80, 'blue');
  }
  else if (playerScored)
  {
    fillText(context, 'Score!', canvas.width / 2, canvas.height - 80, 'black');
  }
  
  numButtons = 0;
  drawImageButton(numButtons, ICON_ID_PLUS, inputMode == INPUT_MODE_CURVE);
  ++numButtons;
  drawImageButton(numButtons, ICON_ID_ARROW_PLUS, inputMode == INPUT_MODE_CONTROL);
  ++numButtons;
  drawImageButton(numButtons, ICON_ID_PLAY, inputMode == INPUT_MODE_PLAY);
  ++numButtons;
}

//
// Event handlers
//

function pageLoaded()
{
  while (curvePoints.length < NUM_CURVE_POINTS)
  {
    curvePoints.push(new b2Vec2(0.0, 0.0));
  }
  
  canvas = document.getElementsByTagName('canvas')[0];
  context = canvas.getContext('2d');
  
  window.addEventListener('resize', windowResized, false);
  window.requestAnimFrame = (function()
  {
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(callback)
            {
              window.setTimeout(callback, 1000 / 60);
            };
  })();
  
  canvas.addEventListener('mousedown', canvasMouseDown, false);
  canvas.addEventListener('mouseup', canvasMouseUp, false);
  canvas.addEventListener('mousemove', canvasMouseMove, false);
  
  createB2World();
  
  windowResized();
}

function windowResized()
{
  var instructionsLabel = document.getElementById('instructions');
  
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.95 - instructionsLabel.offsetHeight;
  
  repositionBasket();
  createB2Ground();
  
  draw();
}

function translateClickToCanvas(node, x, y)
{
  var retVal = new Object();
  retVal.x = x;
  retVal.y = y;
  
  while (node)
  {
    retVal.x -= node.offsetLeft - node.scrollLeft;
    retVal.y -= node.offsetTop - node.scrollTop;
    node = node.offsetParent;
  }
  
  return retVal;
}

function canvasMouseDown(e)
{
  var translatedCoordinates = translateClickToCanvas(e.target, e.clientX, e.clientY);
  var x = translatedCoordinates.x;
  var y = translatedCoordinates.y;
  
  var dirty = false;
  if (isPointInToolbar(x, y))
  {
    dirty = processMouseDownInToolbar(x, y);
  }
  else
  {
    dirty = processMouseDown(x, y);
  }
  
  if (dirty)
  {
    draw();
  }
}

function canvasMouseUp(e)
{
  var dirty = processMouseUp();
  
  if (dirty)
  {
    draw();
  }
}

function canvasMouseMove(e)
{
  var translatedCoordinates = translateClickToCanvas(e.target, e.clientX, e.clientY);
  var x = translatedCoordinates.x;
  var y = translatedCoordinates.y;
  
  var dirty = false;
  if (!isPointInToolbar(x, y))
  {
    dirty = processMouseMove(x, y);
  }
  
  if (dirty)
  {
    draw();
  }
}

//
// UI logic
//

function isPointInToolbar(x, y)
{
  var toolbarWidth = UI_MARGIN + ICON_SIZE;
  var toolbarHeight = numButtons * (UI_MARGIN + ICON_SIZE);
  return x <= toolbarWidth && y <= toolbarHeight;
}

function isPointInBasketArea(x, y)
{
  return x > canvas.width - BASKET_SIZE - ICON_SIZE / 2;
}

function processMouseDownInToolbar(x, y)
{
  var oldInputMode = inputMode;
  inputMode = Math.floor(y / (ICON_SIZE + UI_MARGIN));
  numInputs = 0;
  return oldInputMode != inputMode;
}

function processMouseDown(x, y)
{
  switch (inputMode)
  {
    case INPUT_MODE_CURVE:
    {
      switch (numInputs)
      {
        case 0:
        {
          point1X = control1X = x;
          point1Y = control1Y = y;
          ++numInputs;
          return false;
        }
        case 1:
        {
          point2X = control2X = x;
          point2Y = control2Y = y;
          numInputs = 0;
          getCurvePoints(curvePoints, point1X, point1Y, control1X, control1Y, point2X, point2Y, control2X, control2Y);
          createB2Curve();
          return true;
        }
        default:
        {
          return false;
        }
      }
    }
    case INPUT_MODE_CONTROL:
    {
      pathCircle(context, control1X, control1Y, CONTROL_RADIUS);
      if (context.isPointInPath(x, y))
      {
        selectedControl = CONTROL_ID_1;
      }
      pathCircle(context, control2X, control2Y, CONTROL_RADIUS);
      if (context.isPointInPath(x, y))
      {
        selectedControl = CONTROL_ID_2;
      }
      return selectedControl == CONTROL_ID_1 || selectedControl == CONTROL_ID_2;
    }
    case INPUT_MODE_PLAY:
    {
      if (!isPointInBasketArea(x, y))
      {
        score = 0;
        playerScored = false;
        playerHighScored = false;
        createB2Ball(x, y);
        if (!animating)
        {
          animating = true;
          animate();
        }
        return true;
      }
      return false;
    }
  }
}

function processMouseUp()
{
  var oldSelectedControl = selectedControl;
  selectedControl = CONTROL_ID_NONE;
  return oldSelectedControl != selectedControl;
}

function processMouseMove(x, y)
{
  if (inputMode == INPUT_MODE_CONTROL)
  {
    switch (selectedControl)
    {
      case CONTROL_ID_1:
      {
        control1X = x;
        control1Y = y;
        getCurvePoints(curvePoints, point1X, point1Y, control1X, control1Y, point2X, point2Y, control2X, control2Y);
        createB2Curve();
        return true;
      }
      case CONTROL_ID_2:
      {
        control2X = x;
        control2Y = y;
        getCurvePoints(curvePoints, point1X, point1Y, control1X, control1Y, point2X, point2Y, control2X, control2Y);
        createB2Curve();
        return true;
      }
      default:
      {
        return false;
      }
    }
  }
}

// Game logic

function repositionBasket()
{
  basketX = canvas.width - BASKET_SIZE;
  if (basketY < ICON_SIZE || basketY > (canvas.height - BASKET_SIZE))
  {
    basketY = Math.floor(Math.random() * (canvas.height - BASKET_SIZE - ICON_SIZE)) + ICON_SIZE;
  }
  createB2Basket();
}

// Animation

function animate()
{
  if (inputMode == INPUT_MODE_PLAY && animating)
  {
    requestAnimFrame(animate);
  }
  else
  {
    score = 0;
    animating = false;
  }
  
  // Increase the speed of the simulation
  for (var i = 0; i < 4; ++i)
  {
    world.Step(1 / 60, 10, 10);
    world.ClearForces();
  }
  
  if (ball.GetPosition().y >= -(basketY - ICON_SIZE / 2))
  {
    score += 100;
  }
  
  if (ball.GetLinearVelocity().y == 0 && ball.GetLinearVelocity().x == 0)
  {
    score = 0;
    animating = false;
  }
  
  draw();
}

// Box2D physics

function createB2World()
{
  world = new b2World(new b2Vec2(0.0, -10.0), true);
  
  var contactListener = new b2ContactListener();
  contactListener.BeginContact = function (contact)
  {
    if (contact.GetFixtureA().GetBody().GetUserData() == 'ground'
    || contact.GetFixtureB().GetBody().GetUserData() == 'ground')
    {
      score = 0;
    }
    else if (contact.GetFixtureA().GetBody().GetUserData() == 'basket'
    || contact.GetFixtureB().GetBody().GetUserData() == 'basket')
    {
      playerScored = true;
      if (score > highScore)
      {
        playerHighScored = true;
        highScore = score;
      }
    }
  }
  world.SetContactListener(contactListener);
}

function createB2Ground()
{
  if (ground)
  {
    world.DestroyBody(ground);
  }
  
  var bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_staticBody;
  bodyDef.userData = 'ground';
  ground = world.CreateBody(bodyDef);
  
  var fixDef = new b2FixtureDef();
  fixDef.friction = 0.5;
  fixDef.restitution = 0.5;
  fixDef.filter.categoryBits = CATEGORY_PHYSICS_ENTITIES;
  fixDef.shape = new b2PolygonShape();
  var vertices = [
    new b2Vec2(0.0, 0.0),
    new b2Vec2(0.0, -canvas.height - 1),
    new b2Vec2(canvas.width, -canvas.height - 1),
    new b2Vec2(canvas.width, 0.0)
  ];
  for (var i = 0; i < vertices.length - 1; ++i)
  {
    fixDef.shape.SetAsEdge(vertices[i], vertices[i + 1]);
    ground.CreateFixture(fixDef);
  }
}

function createB2Ball(x, y)
{
  if (ball)
  {
    world.DestroyBody(ball);
  }
  
  var bodyDef = new b2BodyDef();
  bodyDef.position.Set(x, -y);
  bodyDef.angularDamping = 0.1;
  bodyDef.type = b2Body.b2_dynamicBody;
  ball = world.CreateBody(bodyDef);
  
  var fixDef = new b2FixtureDef();
  fixDef.density = 1.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.5;
  fixDef.filter.categoryBits = CATEGORY_PHYSICS_ENTITIES;
  fixDef.shape = new b2CircleShape(BALL_RADIUS);
  ball.CreateFixture(fixDef);
}

function createB2Basket()
{
  if (basket)
  {
    world.DestroyBody(basket);
  }
  
  var bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_staticBody;
  basket = world.CreateBody(bodyDef);
  
  var fixDef = new b2FixtureDef();
  fixDef.restitution = 0.5;
  fixDef.filter.categoryBits = CATEGORY_PHYSICS_ENTITIES;
  fixDef.shape = new b2PolygonShape();
  var vertices = [
    // Adjusting values to match the image
    new b2Vec2(basketX, -basketY),
    new b2Vec2(basketX + 18, -(basketY + BASKET_SIZE - 5)),
    new b2Vec2(basketX + BASKET_SIZE - 18, -(basketY + BASKET_SIZE - 5)),
    new b2Vec2(basketX + BASKET_SIZE, -basketY)
  ];
  for (var i = 0; i < vertices.length - 1; ++i)
  {
    fixDef.shape.SetAsEdge(vertices[i], vertices[i + 1]);
    basket.CreateFixture(fixDef);
  }
  
  // Basket Sensor
  
  if (basketSensor)
  {
    world.DestroyBody(basketSensor);
  }
  
  bodyDef.userData = 'basket';
  basketSensor = world.CreateBody(bodyDef);
  
  fixDef.shape = new b2CircleShape(1);
  fixDef.shape.SetLocalPosition(new b2Vec2(basketX + BASKET_SIZE / 2, -(basketY + BASKET_SIZE / 2)));
  fixDef.isSensor = true;
  fixDef.filter.categoryBits = CATEGORY_LOGIC_ENTITIES;
  basketSensor.CreateFixture(fixDef);
}

function createB2Curve()
{
  if (!(point1X == point2X && point1Y == point2Y))
  {
    if (curve)
    {
      world.DestroyBody(curve);
    }
    
    var bodyDef = new b2BodyDef();
    bodyDef.type = b2Body.b2_staticBody;
    curve = world.CreateBody(bodyDef);
    
    var fixDef = new b2FixtureDef();
    fixDef.friction = 0.5;
    fixDef.filter.categoryBits = CATEGORY_PHYSICS_ENTITIES;
    fixDef.shape = new b2PolygonShape();
    for (var i = 0; i < curvePoints.length - 1; ++i)
    {
      fixDef.shape.SetAsEdge(curvePoints[i], curvePoints[i + 1]);
      curve.CreateFixture(fixDef);
    }
  }
}

