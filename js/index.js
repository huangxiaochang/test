// import home from './home.js';
$.noConflict();
jQuery(document).ready(function($) {
	var width = $(window).width();	//屏幕的宽度
	var height = $(window).height();	//屏幕的高度
	var canvas = $("#canvas");//画布
	var tip = $("#tip");//提示信息div
	var tip_content = $("#tip_content");//提示信息内容
	var context = canvas.get(0).getContext("2d");//获取画布的上下文
	var canvasLength = width;//画布的大小
	var agin = $("#agin");//获取重玩按钮
	var retract = $("#retract").attr("disabled", true);//获取悔棋按钮,并且开始时不可用
	// 使用一个二维数组来保存已下的棋，0为空，1为白色，2为黑色
	var board = [];
	// 记录玩家对战目前的玩家的颜色
	var me = true
	// 上一局赢过之后要按重新开始才能下棋
	var flag = false;
	// 定义一个数组存储所有走过的棋子的坐标，为悔棋做准备
	var currentPath = [];
    // 设置不悔棋的状态，目的为赢棋时候能进行悔棋重玩
    var isNoRetract = true ;
	// 画布宽高和样式的设置
	canvas.css('backgroundColor','#EFF2F7');
	canvas.attr("width",canvasLength+"rem");//设置画布的宽度
	canvas.attr("height",canvasLength+"rem");//设置画布的高度
	canvas.css('marginTop',(height-width-10)/2);

	// 绘制棋盘网格
	draw(context);

	// 画棋盘网格
	function draw(context) {
		var len = canvasLength/16;
		// 先清除画布中的图形
		context.clearRect(0, 0, canvasLength, canvasLength);
		context.strokeStyle = "#99A9BF";
		for (var i = 0; i < 15; i++) {
			context.beginPath();
			context.moveTo(len+i*len, len);
			context.lineTo(len+i*len, len*15);
			context.closePath();
			context.stroke();
			context.beginPath();
			context.moveTo(len, len+i*len);
			context.lineTo(len*15, len+i*len);
			context.closePath();
			context.stroke();
		}
	}

	// 开始进入页面时，初始化页面
	initBoard();

	// 初始化棋盘颜色状态
	function initBoard() {
		for (var i = 0; i < 15; i++) {
			board[i] = []
			for(var j = 0; j < 15; j++) {
				board[i][j] = 0
			}
		}
	}
	
	// 按钮重玩按钮时，把棋盘设置成初始化状态
	agin.click(function(event) {
		// 初始化颜色状态
		initBoard();
		// 重绘网格
		draw(context);
		// 把是否是上一局的状态设置成false
		flag = false;
		// 清空悔棋路径
		currentPath = [];
		// 从白起开始
		me = true;
	})

	// 悔棋时，清空最后一步所下的棋子
	function clearArea(i, j) {
		var length = canvasLength/16;
		// 清空棋子所在的矩形区域
		context.clearRect(i*length+length/2, j*length+length/2, length, length);
		context.strokeStyle = "#99A9BF";
		// 重绘该矩形区域的网格
		context.beginPath();
		context.moveTo(i*length+length/2,j*length+length);
		context.lineTo(i*length+length*3/2,j*length+length);
		context.closePath();
		context.stroke();
		context.beginPath();
		context.moveTo(i*length+length,j*length+length/2);
		context.lineTo(i*length+length,j*length+length*3/2);
		context.closePath();
		context.stroke();
	}

	// 悔棋功能，只能悔棋一步
	retract.click(function(event) {
		var currentChess = {}
		// 从悔棋路径中获取最后一步棋
		currentChess = currentPath.pop();
		// 清空已经绘制的图片
		clearArea(currentChess.i, currentChess.j);
		// 把颜色状态设置成0
		board[currentChess.i][currentChess.j] = 0;
		// 把玩家设置成上一个玩家
		me = !me;
		// 把不悔棋状态改成false
		isNoRetract = false;
		// 如果悔棋路径中没有棋子
		if (currentPath.length === 0) {
			// 把悔棋按钮状态设置成不可用状态
			isable(true);
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
		var x = 0;
		var y = 0;
		// 获取画布相对于文档的位置
		var canvasPos = this.getBoundingClientRect();
		x = event.clientX-canvasPos.left;
		y = event.clientY-canvasPos.top;
		// 转化成坐标
		var len = canvasLength/16;
		var i = 0;
		var j = 0;
		i = Math.round(Math.floor(x/len));
		j =  Math.round(Math.floor(y/len));
		if (j >= 15 || i >= 15 || j < 0 || i < 0) {
			return false;
		}
		// 玩家对战
		drawChess(context, i, j, len);
	});
	
	// 画棋子
	function drawChess(context, i, j, radius) {
		// 判断i,j是否已经有棋子
		if (board[i][j] !== 0) {
			return
		}
		// me: true-白色，false-黑色
		// 玩家对战时，第一个玩家的棋子颜色为白色
		if (me) {
			var g1 = context.createRadialGradient((i+1)*radius+2, (j+1)*radius-2, 13, (i+1)*radius+2, (j+1)*radius-2, 0);
			g1.addColorStop(0,'#d1d1d1');
			g1.addColorStop(1,'#f9f9f9');
			context.fillStyle = g1;
		}
		else {
			var g2 = context.createRadialGradient((i+1)*radius+2, (j+1)*radius-2, 13, (i+1)*radius+2, (j+1)*radius-2, 0);
			g2.addColorStop(0,'#0a0a0a');
			g2.addColorStop(1,'#636766');
			context.fillStyle = g2;
		}
		context.beginPath();
		context.arc((i+1)*radius, (j+1)*radius, radius/2, 0, 2*Math.PI, false);
		context.closePath();
		context.fill();

		// 加入悔棋路径
		currentPath.push({
			i: i,
			j: j
		})
		// 同时把悔棋按钮状态改成可用
		isable(false);

		//  把棋盘数组board对弈的i,j设置成相应的颜色，并判断输赢
		if (me) {
			// 第一个玩家的棋子为白色
			board[i][j] = 1;
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

	// 判断每次下棋之后，是否获得胜利，方法是已每次下棋的坐标为中心，判断4个方向的9个坐标中是否有连续5个坐标的
	//颜色与中心点相同
	function isWin(i, j, color) {
		// 判断是否存在该点
		var flag = false;
		var count = 0
		// 判断是否存在该点
		var k = 0;
		var t = 0;
		k = existPos(i).i;
		t = existPos(i).j;
	
		// 判断横向
		count = 0;

		for(var m = k; m <= t; m++) {
			// 同色
			if (board[m][j] === color) {
				if (++count === 5) {
					return true;
				}
			}
			else {
				count = 0;
			}
		}
		
		// 判断纵向
		k = existPos(j).i;
		t = existPos(j).j;
		count = 0;
		flag = false;

		for(var m = k; m <= t; m++) {
			// 同色
			if (board[i][m] === color) {
				if (++count === 5) {
					return true;
				}
			}
			else {
				count = 0;
			}
		}
		
		// 判断正斜线
		k = existPos(i).i;
		t = existPos(i).j;
		count  = 0;
		flag = false;

		for(var m = k; m <= t; m++) {
			if (m <= i) {
				// 同色
				if (board[m][j+i-m] === color) {
					if (++count === 5) {
						return true;
					}
				}
				else {
					count = 0;
				}
			}
			else {
				// 同色
				if (board[m][j-m+i] === color) {
					if (++count === 5) {
						return true;
					}
				}
				else {
					count = 0;
				}
			}
		}

		count  = 0;
		flag = false;
		// 判断反斜线

		for(var m = k; m <= t; m++) {
			if (m <= i) {
				// 同色
				if (board[m][j-i+m] === color) {
					if (++count === 5) {
						return true;
					}
				}
				else {
					count = 0;
				}
			}
			else {
				// 同色
				if (board[m][j+m-i] === color) {
					if (++count === 5) {
						return true;
					}
				}
				else {
					count = 0;
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

})