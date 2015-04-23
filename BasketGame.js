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

var BALL_RADIUS = ICON_SIZE / 2;
var BALL_DROP_SPEED = -1;

var NUM_CURVE_POINTS = 50;

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

var world = null;
var ball = null;
var basketX = 0;
var basketY = 0;

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
    
    points[i].set_x(x);
    points[i].set_y(-y);
  }
}

function drawCurvePoints(ctx, points)
{
  for (var i = 0; i < points.length; ++i)
  {
    fillCircle(ctx, points[i].get_x(), -points[i].get_y(), 1);
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

function drawRect(ctx, x, y, w, h)
{
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.rect(x, y, w, h);
  ctx.stroke();
  ctx.restore();
}

function fillRect(ctx, x, y, w, h, color)
{
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.restore();
}

function getTextSize(ctx, text)
{
  ctx.save();
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  var textSize = ctx.measureText(text);
  ctx.restore();
  
  return textSize;
}

function fillText(ctx, text, x, y)
{
  ctx.save();
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'black';
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
  
  drawImage(context, image, positionVec.get_x() - BALL_RADIUS, -positionVec.get_y() - BALL_RADIUS, -ball.GetAngle());
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
      drawControl(true, point1X, point1Y, control1X, control1Y, selectedControl == CONTROL_ID_1);
      drawControl(true, point2X, point2Y, control2X, control2Y, selectedControl == CONTROL_ID_2);
      break;
    }
    case INPUT_MODE_PLAY:
    {
      drawBall();
    }
  }
  
  drawBasketArea();
  
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
    curvePoints.push(new Box2D.b2Vec2(0.0, 0.0));
  }
  
  canvas = document.getElementsByTagName('canvas')[0]
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
  
  windowResized();
}

function windowResized()
{
  var instructionsLabel = document.getElementById('instructions');
  
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.95 - instructionsLabel.offsetHeight;
  
  repositionBasket();
  
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
          break;
        }
        case 1:
        {
          point2X = control2X = x;
          point2Y = control2Y = y;
          numInputs = 0;
          break;
        }
      }
      getCurvePoints(curvePoints, point1X, point1Y, control1X, control1Y, point2X, point2Y, control2X, control2Y);
      return true;
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
        dropBall(x, y);
        animate();
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
        return true;
      }
      case CONTROL_ID_2:
      {
        control2X = x;
        control2Y = y;
        getCurvePoints(curvePoints, point1X, point1Y, control1X, control1Y, point2X, point2Y, control2X, control2Y);
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
}

// Animation

function animate()
{
  if (inputMode == INPUT_MODE_PLAY && !(ball.GetLinearVelocity().get_y() == 0 && ball.GetLinearVelocity().get_x() == 0))
  {
    requestAnimFrame(animate);
  }
  world.Step(1/60, 3, 2);
  //world.DrawDebugData();
  draw();
}

// Box2D physics

function dropBall(x, y)
{
  if (world)
  {
    Box2D.destroy(world);
  }
  world = new Box2D.b2World(new Box2D.b2Vec2(0.0, -40.0));
  
  //var debugDraw = getCanvasDebugDraw();
  //debugDraw.SetFlags(0x0001);
  //world.SetDebugDraw(debugDraw);
  
  var ballDef = new Box2D.b2BodyDef();
  ballDef.set_type(Module.b2_dynamicBody);
  ballDef.set_position(new Box2D.b2Vec2(0, 0));
  
  var ballShape = new Box2D.b2CircleShape();
  ballShape.set_m_radius(BALL_RADIUS);
  
  ball = world.CreateBody(ballDef);
  ball.CreateFixture(ballShape, 1.0);
  ball.SetTransform(new Box2D.b2Vec2(x, -y), 0.0);
  ball.SetLinearVelocity(new Box2D.b2Vec2(0, BALL_DROP_SPEED));
  ball.SetAwake(1);
  ball.SetActive(1);
  
  var groundDef = new Box2D.b2BodyDef();
  var ground = world.CreateBody(groundDef);
  
  var groundShape = new Box2D.b2EdgeShape();
  var groundFixtureDef = new Box2D.b2FixtureDef();
  groundFixtureDef.set_restitution(0.0);
  groundFixtureDef.set_shape(groundShape);
  
  groundShape.Set(new Box2D.b2Vec2(0.0, -canvas.height), new Box2D.b2Vec2(canvas.width, -canvas.height));
  ground.CreateFixture(groundFixtureDef);
  groundShape.Set(new Box2D.b2Vec2(0.0, 0.0), new Box2D.b2Vec2(0.0, -canvas.height));
  ground.CreateFixture(groundFixtureDef);
  groundShape.Set(new Box2D.b2Vec2(canvas.width, 0.0), new Box2D.b2Vec2(canvas.width, -canvas.height));
  ground.CreateFixture(groundFixtureDef);
  
  for (var i = 0; i < curvePoints.length - 1; ++i)
  {
    groundShape.Set(curvePoints[i], curvePoints[i + 1]);
    ground.CreateFixture(groundFixtureDef);
  }
  
  var basketDef = new Box2D.b2BodyDef();
  var basket = world.CreateBody(basketDef);
  
  var basketShape = new Box2D.b2EdgeShape();
  var basketFixtureDef = new Box2D.b2FixtureDef();
  basketFixtureDef.set_restitution(0.5);
  basketFixtureDef.set_shape(basketShape);
  
  // Adjusting values to match the image
  var basketPoint2 = new Box2D.b2Vec2(basketX + 18, -(basketY + BASKET_SIZE - 5));
  var basketPoint3 = new Box2D.b2Vec2(basketX + BASKET_SIZE - 18, -(basketY + BASKET_SIZE - 5));
  basketShape.Set(new Box2D.b2Vec2(basketX, -basketY), basketPoint2);
  basket.CreateFixture(basketFixtureDef);
  basketShape.Set(basketPoint2, basketPoint3);
  basket.CreateFixture(basketFixtureDef);
  basketShape.Set(basketPoint3, new Box2D.b2Vec2(basketX + BASKET_SIZE, -basketY));
  basket.CreateFixture(basketFixtureDef);
}

function getCanvasDebugDraw()
{
  var debugDraw = new Box2D.JSDraw();
  
  debugDraw.DrawSegment = function(vert1, vert2, color)
  {
    var vert1V = Box2D.wrapPointer(vert1, Box2D.b2Vec2);
    var vert2V = Box2D.wrapPointer(vert2, Box2D.b2Vec2);
    drawLine(context, vert1V.get_x(), -vert1V.get_y(), vert2V.get_x(), -vert2V.get_y(), 'green', 1);
  };
  
  debugDraw.DrawPolygon = function(vertices, vertexCount, color)
  {
    alert('Box2D drawing polygon!');
  };
  
  debugDraw.DrawSolidPolygon = function(vertices, vertexCount, color)
  {
    alert('Box2D drawing solid polygon!');
  };
  
  debugDraw.DrawCircle = function(center, radius, color)
  {
    var centerV = Box2D.wrapPointer(center, Box2D.b2Vec2);
    drawCircle(context, centerV.get_x(), -centerV.get_y(), radius, 1);
  };
  
  debugDraw.DrawSolidCircle = function(center, radius, axis, color)
  {
    var centerV = Box2D.wrapPointer(center, Box2D.b2Vec2);
    fillCircle(context, centerV.get_x(), -centerV.get_y(), radius);
  };
  
  debugDraw.DrawTransform = function(transform)
  {
    alert('Box2D drawing transform!');
  };
  
  return debugDraw;
}

