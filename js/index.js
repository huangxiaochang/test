// import home from './home.js';
$.noConflict();
jQuery(document).ready(function($) {
	var width = $(window).width();	//屏幕的宽度
	var height = $(window).height();	//屏幕的高度
	var canvas = $("#canvas");//画布
	var tip = $("#tip");//提示信息div
	var tip_content = $("#tip_content");//提示信息内容
	var context = canvas.get(0).getContext("2d");//获取画布的上下文
	var canvasLength = width-60;//画布的大小
	canvas.css('backgroundColor','#EFF2F7');
	canvas.attr("width",canvasLength+"rem");//设置画布的宽度
	canvas.attr("height",canvasLength+"rem");//设置画布的高度
	canvas.css('marginTop',(height-width+60)/2);
	draw(context);

	// 画棋盘网格
	function draw(context) {
		let len = canvasLength/16;
		context.strokeStyle = "#99A9BF";
		for (let i = 0; i < 15; i++) {
			context.moveTo(len+i*len, len);
			context.lineTo(len+i*len, len*15)
			context.stroke()
			context.moveTo(len, len+i*len);
			context.lineTo(len*15, len+i*len)
			context.stroke()
		}
	}
	// 使用一个二维数组来保存已下的棋，0为空，1为白色，2为黑色
	var board = []
	for (let i = 0; i < 15; i++) {
		board[i] = []
		for(let j = 0; j < 15; j++) {
			board[i][j] = 0
		}
	}

	// 记录玩家对战目前的玩家的颜色
	var me = true

	// 获取鼠标在画布中的点击的相对的位置
	canvas.click(function(event) {
		let x = 0;
		let y = 0;
		// 获取画布相对于文档的位置
		let canvasPos = this.getBoundingClientRect();
		x = event.clientX-canvasPos.left;
		y = event.clientY-canvasPos.top;
		// 转化成坐标
		let len = canvasLength/16;
		let i = 0;
		let j = 0;
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
			let g1 = context.createRadialGradient((i+1)*radius+2, (j+1)*radius-2, 13, (i+1)*radius+2, (j+1)*radius-2, 0);
			g1.addColorStop(0,'#d1d1d1');
			g1.addColorStop(1,'#f9f9f9');
			context.fillStyle = g1;
		}
		else {
			let g2 = context.createRadialGradient((i+1)*radius+2, (j+1)*radius-2, 13, (i+1)*radius+2, (j+1)*radius-2, 0);
			g2.addColorStop(0,'#0a0a0a');
			g2.addColorStop(1,'#636766');
			context.fillStyle = g2;
		}
		context.beginPath();
		context.arc((i+1)*radius, (j+1)*radius, radius/2, 0, 2*Math.PI, false);
		context.closePath();
		context.fill();
		//  把棋盘数组board对弈的i,j设置成相应的颜色，并判断输赢
		if (me) {
			// 第一个玩家的棋子为白色
			board[i][j] = 1;
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
				else {
					// 轮到对手下棋
					me = false;
				}
			}
		}
		// 第二个玩家的棋子为黑色
		else {
			board[i][j] = 2;
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
				else {
					// 轮到对手下棋
					me = true;
				}
			}
		}
	}

	// 判断每次下棋之后，是否获得胜利，方法是已每次下棋的坐标为中心，判断4个方向的9个坐标中是否有连续5个坐标的
	//颜色与中心点相同
	function isWin(i, j, color) {
		let flag = false;
		let count = 0
		// 判断是否存在该点
		let k = 0;
		let t = 0;
		k = existPos(i).i;
		t = existPos(i).j;
	
		// 判断横向
		count = 0;
		for(let m = k; m <= t; m++) {
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
		for(let m = k; m <= t; m++) {
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
		for(let m = k; m <= t; m++) {
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
		for(let m = k; m <= t; m++) {
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
		for (let i = 0; i < 15; i++) {
			for(let j = 0; j < 15; j++) {
				if (board[i][j] === 0) {
					return false
				}
			}
		}
		return true
	}

	// 判断4个方向上的点是否超出棋盘，并把超出的部分转化成合理网格
	function existPos(pos) {
		let k = pos-4;
		let t = pos+4;
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
		tip.css("display","none");
	})

})