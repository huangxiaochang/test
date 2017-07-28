// import home from './home.js';
$.noConflict();
jQuery(document).ready(function($) {
	var width = $(window).width();	//获取屏幕的宽度，棋盘的宽将根据屏幕的宽度进行响应式
	var height = $(window).height();	//获取屏幕的高度，棋盘的高将根据屏幕的宽度进行响应式
	var canvas = $("#canvas");//获取画布元素
	var player = $("#player");//获取玩家对战按钮
	var machine = $("#machine").addClass('current_model');//人机对战按钮,默认打开网页是为人机对战
	var tip = $("#tip");//提示信息div元素
	var tip_content = $("#tip_content");//提示信息内容元素
	var agin = $("#agin");//获取重玩按钮
	var retract = $("#retract").attr("disabled", true).addClass('btn_disable');//获取悔棋按钮,并且开始时不可用

	// 整个程序的全局变量
	var context = canvas.get(0).getContext("2d");//获取画布的上下文
	var canvasLength = width-8;//画布的大小
	var len = canvasLength/15;//每一个网格之间的间距
	var board = [];// 使用一个二维数组来保存已下的棋，0为空，1为白色，2为黑色
	var me = true;// 记录玩家对战目前的玩家的颜色
	var flag = false;// 上一局赢过之后要按重新开始才能下棋
	var currentPath = [];// 定义一个数组存储所有走过的棋子的坐标，为悔棋做准备
    var isNoRetract = true ;// 设置不悔棋的状态，目的为赢棋时候能进行悔棋重玩
    var type = 1;// 对战模式0-玩家，1-人机

    // 人机对战模式的相关变量
    var wins = [];	//赢法数组，主要用于人机对战,是一个三维数组，[i][j][k],i,j,表示对应的网格坐标，k表示第几种赢法,值为true/false的Boolean类型
    var count = 0 ;	//赢法个数
    var myWins = [];//玩家的赢法统计
    var computerWins = [];//计算机的赢法统计
    var over = false;//是否游戏结束

	// 画布宽高和样式的设置
	// canvas.css('backgroundColor','#EFF2F7');
	canvas.attr("width",canvasLength+"rem");//设置画布的宽度
	canvas.attr("height",canvasLength+"rem");//设置画布的高度
	canvas.css('marginTop',"2rem");

	// 绘制棋盘网格和背景
	draw(context);
	drawText(context);

	// 初始化数据
	initBoard(); // 开始进入页面时，初始化网格的颜色状态
	initWins();  //初始化赢法数组
	initWinsNum(); //初始化人和电脑的赢法统计数组

	// 画棋盘网格
	function draw(context) {
		// 先清除画布中的图形
		context.clearRect(0, 0, canvasLength, canvasLength);
		context.strokeStyle = "#99A9BF";
		context.globalCompositeOperation = "destination-over";
		context.globalAlpha = 0.8;
		for (var i = 0; i < 15; i++) {
			context.beginPath();
			context.moveTo(len/2+i*len, len/2);
			context.lineTo(len/2+i*len, len/2+len*14);
			context.closePath();
			context.stroke();
			context.beginPath();
			context.moveTo(len/2, len/2+i*len);
			context.lineTo(len/2+len*14, len/2+i*len);
			context.closePath();
			context.stroke();
		}
	}

	// 绘制棋盘背景
	function drawText(context) {
		var img = new Image();
		img.src = "img/bg.png";
		// 不能直接使用 context.drawImage(img,0,0);这样绘制不出来，原因是图片还没有加载的时候，
		//已经执行了context.drawImage();函数
		context.globalCompositeOperation = "source-over";
		context.fillStyle = "rgba(100,150,185,0.15)";
		context.font = "9rem Calibri";
		var textLength = context.measureText("对 弈");
		context.fillText("对 弈", (canvasLength-textLength.width)/2, canvasLength/2);
		context.globalCompositeOperation = "destination-over";
		context.globalAlpha = 0.5;
		img.onload = function() {
			context.drawImage(img,0,0, canvasLength, canvasLength);
		}
		
	}

	// 初始化棋盘颜色状态,和人机对战的赢法数组
	function initBoard() {
		for (var i = 0; i < 15; i++) {
			board[i] = [];
			wins[i] = [];
			for(var j = 0; j < 15; j++) {
				board[i][j] = 0;
				wins[i][j] = [];
			}
		}
	}
	
	// 按钮重玩按钮时，把棋盘设置成初始化状态
	agin.click(function(event) {
		resetChess();
	})

	//重置棋盘的函数
	function resetChess() {
		initBoard();// 初始化颜色状态
		draw(context); // 重绘网格
		drawText(context); //重置背景
		initWins();  //重置人机赢法数组
		initWinsNum(); //重置人和电脑赢法统计数组
		flag = false; // 把是否是上一局的状态设置成false
		over = false; //把人机对战是的游戏是否结束的状态设置false
		currentPath = []; // 清空悔棋路径
		isNoRetract = true; //把不悔棋状态设置成true
		me = true; // 重置第一次下棋的状态，人机对战时为玩家先下棋，玩家对战时为第一个玩家
	}

	// 玩家对战的按钮
	player.click(function(event) {
		type = 0;//玩家对战类型
		resetChess();// 重置棋盘
		machine.removeClass('current_model');
		player.addClass('current_model');
	})

	// 人机对战的按钮
	machine.click(function(event) {
		type = 1; //人机对战模式
		resetChess();// 重置棋盘
		player.removeClass('current_model');
		machine.addClass('current_model');
	})

	// 悔棋时，清空最后一步所下的棋子
	function clearArea() {
		draw(context); //重绘网格
		// 重新绘制棋子
		for (var k = 0; k < currentPath.length; k++) {
			drawChess(context, currentPath[k].i, currentPath[k].j, currentPath[k].color, len);
		}
		drawText(context); //重绘背景
	}

	// 悔棋功能，一次悔棋一步
	retract.click(function(event) {
		var myCurrentChess = {};
		var comCurrentChess = {};
		// 如果是玩家对战模式
		if (type == 0) {
			myCurrentChess = currentPath.pop();// 从悔棋路径中获取最后一步棋
			board[myCurrentChess.i][myCurrentChess.j] = 0;// 把颜色状态设置成0
			clearArea(); // 清空已经绘制的图片
			me = !me;// 把玩家设置成上一个玩家
		}
		// 人机对战
		else {
			comCurrentChess = currentPath.pop();// 从悔棋路径中获取计算机最后一步棋
			board[comCurrentChess.i][comCurrentChess.j] = 0; // 把颜色状态设置成0,即去除玩家颜色占位
			myCurrentChess = currentPath.pop();// 从悔棋路径中获取玩家最后一步棋
			board[myCurrentChess.i][myCurrentChess.j] = 0;// 把颜色状态设置成0,即去除电脑颜色占位
			clearArea();// 清空已经绘制的图片
			me = true; //悔棋后到玩家开始玩
			// 更新玩家和电脑的赢法统计数组
			for(var k = 0 ; k < count ; k++) {
				if (wins[comCurrentChess.i][comCurrentChess.j][k]) {
					computerWins[k] -= 1;
					if (computerWins[k] == 0) {
						myWins[k] = 0;
					}
				}
				if (wins[myCurrentChess.i][myCurrentChess.j][k]) {
					myWins[k] -= 1;
					if (myWins[k] == 0) {
						computerWins[k] = 0;
					}
				}
			}
		}
		flag = false; //赢了之后再悔棋，允许重新下棋
		over = false; //赢了之后再悔棋时，把游戏结束状态设置成false
		isNoRetract = false;// 把不悔棋状态改成false
		// 如果悔棋路径中没有棋子
		if (currentPath.length === 0) {
			isable(true);// 把悔棋按钮状态设置成不可用状态
			retract.addClass('btn_disable');
			return false;
		}
	})

	// 设置悔棋按钮的可用状态
	function isable(status) {
		retract.attr("disabled", status);
	}

	// 获取鼠标在画布中的点击的相对的位置
	canvas.click(function(event) {
		// 如果是上一局赢过之后并且没有悔棋的话，还没有清空棋盘，不能开始新的一局
		if (flag && isNoRetract) {
			tip.css('display','block');
			tip_content.html('请重新开始新的一局');
			return false;
		}
		// 获取在棋盘中点击的坐标
		var x = 0;
		var y = 0;
		x = event.offsetX;
        y = event.offsetY;
        var i = Math.floor(x / len);
        var j = Math.floor(y / len);
		// // 获取画布相对于文档的位置
		// var canvasPos = this.getBoundingClientRect();
		// x = event.clientY-canvasPos.top;
		// y = event.clientX-canvasPos.left;

		// // 转化成坐标
		// var len = canvasLength/15;
		// var i = 0;
		// var j = 0;
		// i = Math.round(Math.floor(x/len));
		// j =  Math.round(Math.floor(y/len));
		if (j >= 15 || i >= 15 || j < 0 || i < 0) {
			return false;
		}
		// 判断i,j是否已经有棋子
		if (board[i][j] !== 0) {
			return false;
		}
		// 玩家对战
		if (type === 0) {
			drawChess(context, i, j, me, len);// 画棋子
			isable(false);// 同时把悔棋按钮状态改成可用
			retract.removeClass('btn_disable');
			//  把棋盘数组board对弈的i,j设置成相应的颜色，并判断输赢
			// 第一个玩家的棋子为白色
			if (me) {
				board[i][j] = 1; //第一个玩家的棋子颜色占位
				// 加入悔棋路径
				currentPath.push({
					i: i,
					j: j,
					color: true
				})
				me = false;//到对手下棋
				if (isWin(i, j, 1)) {
					tip.css('display','block');
					tip_content.html('恭喜!白棋赢了');
					return false;
				}
				// 判断是否和棋
				else {
					if (winWin()) {
						tip.css('display','block');
						tip_content.html('平局');
						return false;
					}
				}
			}
			// 第二个玩家的棋子为黑色
			else {
				board[i][j] = 2;
				// 加入悔棋路径
				currentPath.push({
					i: i,
					j: j,
					color: false
				})
				me = true;//到对手下棋
				if (isWin(i, j, 2)) {
					tip.css('display','block');
					tip_content.html('恭喜!黑棋赢了');
					return false;
				}
				// 判断是否和棋
				else {
					if (winWin()) {
						tip.css('display','block');
						tip_content.html('平局');
						return false;
					}
				}
			}
		}
		
		// 人机对战
		else {
			// 游戏结束
			if (over) {
				return;
			}
			// 只有白棋才能手动下棋，白棋代表玩家，黑棋代表电脑
			if (!me) {
				return;
			}
			drawChess(context, i, j, me, len);// 绘制玩家下的棋子
			board[i][j] = 1;// 设置颜色标签成白色
			// 加入悔棋路径
			currentPath.push({
				i: i,
				j: j,
				color: true
			})

			// 遍历所有的赢法数组
			for (var k = 0; k < count; k++) {
				// 如果所下的棋子在赢法数组上，说明玩家在第i种赢法上的胜算大了一步
				if (wins[i][j][k]) {
					myWins[k]++;	//胜算同意增加1,
					computerWins[k] = 6;//计算机在这种算法上就不可能赢了，设置一个异常的值6进行标记
					if (myWins[k] == 5) {
						// 如果这种赢法所需要的棋子已经达到5个，说明已经赢了
						tip.css('display','block');
						tip_content.html('恭喜!您赢了');
						over = true;
						return false;
					}
				}
			}
			// 如果玩家还没有赢，则到电脑下棋
			if (!over) {
				me = !me;
				computerAI(context,len);// 计算机下棋算法
			}
		}
	});
	
	// 画棋子
	function drawChess(context, i, j, me, radius) {
		// me: true-白色，false-黑色
		// 玩家对战时，第一个玩家的棋子颜色为白色
		if (me) {
			var g1 = context.createRadialGradient( i*radius+radius/2+2,j*radius+radius/2-2, 13,  i*radius+radius/2+2, j*radius+radius/2, 0);
			g1.addColorStop(0,'#d1d1d1');
			g1.addColorStop(1,'#f9f9f9');
			context.fillStyle = g1;
		}
		else {
			var g2 = context.createRadialGradient( i*radius+radius/2+2,j*radius+radius/2-2, 13, i*radius+radius/2+2, j*radius+radius/2, 0);
			g2.addColorStop(0,'#0a0a0a');
			g2.addColorStop(1,'#636766');
			context.fillStyle = g2;
		}

		context.globalCompositeOperation = "source-over";
		context.globalAlpha = 1;

		// 绘制棋子阴影
		context.shadowOffsetX = 2;
		context.shadowOffsetY = 2;
		context.shadowBlur = 3;
		context.shadowColor = "rgba(0, 0, 0, 0.3)";

		context.beginPath();
		context.arc( i*radius+radius/2, j*radius+radius/2, radius/2, 0, 2*Math.PI, false);
		context.closePath();
		context.fill();
	}

	// 判断每次下棋之后，是否获得胜利，方法是已每次下棋的坐标为中心，判断4个方向的9个坐标中是否有连续5个坐标的
	//颜色与中心点相同
	function isWin(i, j, color) {
		// 判断是否存在该点
		var flag = false;
		var num = 0
		// 判断是否存在该点
		var k = 0;
		var t = 0;
		k = existPos(i).i;
		t = existPos(i).j;
	
		// 判断横向
		num = 0;

		for(var m = k; m <= t; m++) {
			// 同色
			if (board[m][j] === color) {
				if (++num === 5) {
					return true;
				}
			}
			else {
				num = 0;
			}
		}
		
		// 判断纵向
		k = existPos(j).i;
		t = existPos(j).j;
		num = 0;
		flag = false;

		for(var m = k; m <= t; m++) {
			// 同色
			if (board[i][m] === color) {
				if (++num === 5) {
					return true;
				}
			}
			else {
				num = 0;
			}
		}
		
		// 判断正斜线
		k = existPos(i).i;
		t = existPos(i).j;
		num  = 0;
		flag = false;

		for(var m = k; m <= t; m++) {
			if (m <= i) {
				// 同色
				if (board[m][j+i-m] === color) {
					if (++num === 5) {
						return true;
					}
				}
				else {
					num = 0;
				}
			}
			else {
				// 同色
				if (board[m][j-m+i] === color) {
					if (++num === 5) {
						return true;
					}
				}
				else {
					num = 0;
				}
			}
		}

		num  = 0;
		flag = false;
		// 判断反斜线

		for(var m = k; m <= t; m++) {
			if (m <= i) {
				// 同色
				if (board[m][j-i+m] === color) {
					if (++num === 5) {
						return true;
					}
				}
				else {
					num = 0;
				}
			}
			else {
				// 同色
				if (board[m][j+m-i] === color) {
					if (++num === 5) {
						return true;
					}
				}
				else {
					num = 0;
				}
			}
		}
		// 4个方向都没有找到
		return false;
	}

	// 判断是否是和棋
	function winWin() {
		// 如果全部的网格都有棋子的话，为和棋
		for (var i = 0; i < 15; i++) {
			for(var j = 0; j < 15; j++) {
				if (board[i][j] === 0) {
					return false
				}
			}
		}
		return true
	}

	// 判断4个方向上的点是否超出棋盘，并把超出的部分转化成合理网格
	function existPos(pos) {
		var k = pos-4;
		var t = pos+4;
		if (k < 0) {
			k = 0 ;
		}
		if (t > 14) {
			t = 14
		}
		return {
			i: k,
			j: t
		}
	}

	// 如果点击的是内容框，则禁止事件冒泡到外层div
	tip_content.click(function(event) {
		event.preventDefault();
		event.stopPropagation();
	})
	// 关闭提示框
	tip.click(function(event) {
		flag = true;
		tip.css("display","none");
	})

	// 初始化人机对战的赢法数组
	function initWins() {
		count = 0;

		// 横排赢法
		for (var i = 0; i < 15; i++) {
			for (var j = 0; j < 11; j++) {
				for (var k = 0; k < 5; k++) {		
					wins[i][j+k][count] = true;
				}
				count++;
			}
		}

		// 竖排赢法
		for(var i = 0; i < 15; i++){
			for(var j = 0; j < 11; j++){
				for(var k = 0; k < 5; k++){
					wins[j+k][i][count] = true;
				}
				count++;
			}
		}

		// 正斜线赢法
		for (var i = 0; i < 11; i++) {
			for (var j = 0; j < 11; j++) {
				for (var k = 0; k < 5; k++) {
					wins[i+k][j+k][count] = true;
				}
				count++;
			}
		}

		// 反斜线赢法
		for (var i = 0; i < 11; i++) {
			for (var j = 14; j > 3; j--) {
				for (var k = 0; k < 5; k++) {
					wins[i+k][j-k][count] = true;
				}
				count++;
			}
		}
	}

	// 初始化玩家和电脑的赢法统计数组
	function initWinsNum() {
		for (var i = 0; i < count; i++) {
			myWins[i] = 0;
			computerWins[i] = 0;
		}
	}

	// 计算机下棋算法
	function computerAI(context,radius) {
		var myScore = [];//玩家棋盘上的得分
		var computerScore = [];//电脑棋盘上的得分
		var maxScore = 0;//保存最高的得分
		var maxScoreX = 0 , maxScoreY = 0 ; //最高得分的坐标

		// 初始化等分数组
		for(var i=0; i < 15; i++) {
			myScore[i] = [];
			computerScore[i] = [];
			for(var j=0; j < 15; j++) {
				myScore[i][j] = 0;
				computerScore[i][j] = 0;
			}
		}
		
		// 开始遍历棋盘赢法数组，判断下棋的坐标
		for(var i=0; i < 15; i++) {
			for(var j=0; j < 15; j++) {
				// 如果此点还没有棋子的话
				if (board[i][j] === 0) {
					for (var k = 0; k < count; k++) {
						// 如果这个点在赢法数组上
						if (wins[i][j][k]) {
							// 然后判断玩家-白棋在这种赢法上已有的棋子数进行对应的权重赋值
							if (myWins[k] === 1) {
								// 如果还只是一个棋子的话，给它累加一个最低的权重值
								myScore[i][j] += 200;
							}
							else if (myWins[k] === 2) {
								myScore[i][j] += 400;
							}
							else if (myWins[k] === 3) {
								myScore[i][j] += 2000;
							}
							else if (myWins[k] === 4) {
								myScore[i][j] += 10000;
							}
							//判断计算机棋子每一步的得分，它在每一种棋子个数的权重要比玩家的赋值大
							if (computerWins[k] === 1) {
								// 如果还只是一个棋子的话，给它累加一个最低的权重值
								computerScore[i][j] += 220;
							}
							else if (computerWins[k] === 2) {
								computerScore[i][j] += 420;
							}
							else if (computerWins[k] === 3) {
								computerScore[i][j] += 2100;
							}
							else if (computerWins[k] === 4) {
								computerScore[i][j] += 20000;
							}
						}
					}
					// 判断玩家在这一格点位置的最高分数并拦截
					// 如果玩家此点的分数比最高分还高的话，重新赋值最高值和更新最高分数的坐标
					if (myScore[i][j] > maxScore) {
						maxScore = myScore[i][j];
						maxScoreX = i;
						maxScoreY = j;
					}
					// 如果和最高分相等的话，则和电脑此点的分数比较
					else if (myScore[i][j] == maxScore) {
						if (computerScore[i][j] > computerScore[maxScoreX][maxScoreY]) {
							maxScoreX = i;
							maxScoreY = j;
						}
					}

					// 电脑判断自己下的棋子落到 那个点分数才能最高
					if (computerScore[i][j] > maxScore) {
						maxScore = computerScore[i][j];
						maxScoreX = i;
						maxScoreY = j;
					}
					// 如果和最高分相等的话，则和电脑此点的分数比较
					else if (computerScore[i][j] == maxScore) {
						if (myScore[i][j] > myScore[maxScoreX][maxScoreY]) {
							maxScoreX = i;
							maxScoreY = j;
						}
					}
				}
			}
		}
			
		// 电脑落棋
		drawChess(context, maxScoreX, maxScoreY, me, radius);
		board[maxScoreX][maxScoreY] = 2;
		// 加入悔棋路径
		currentPath.push({
			i: maxScoreX,
			j: maxScoreY,
			color: false
		})
		// 同时把悔棋按钮状态改成可用
		isable(false);
		retract.removeClass('btn_disable');
		// 遍历所有的赢法数组
		for (var k = 0; k < count; k++) {
			// 如果所下的棋子在赢法数组上，说明电脑在第i种赢法上的胜算大了一步
			if (wins[maxScoreX][maxScoreY][k]) {
				computerWins[k]++;	//胜算同意增加1,
				myWins[k] = 6;//玩家在这种算法上就不可能赢了，设置一个异常的值6进行标记
				if (computerWins[k] == 5) {
					// 如果这种赢法所需要的棋子已经达到5个，说明电脑已经赢了
					tip.css('display','block');
					tip_content.html('很遗憾!电脑赢了');
					over = true;
					return false;
				}
			}
		}
		// 如果电脑还没有赢，则到玩家下棋
		if (!over) {
			me = !me;
		}
	}

})