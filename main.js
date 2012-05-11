google.load("visualization", "1", {packages:["corechart"]});

var viewer = {
	current_course_term: '11-12',
	start_date: '9/6/2011',
	marking_period_end_dates: {
		MP1: '11/9/2011',
		MP2: '1/26/2012',
		MP3: '3/30/2012',
		MP4: '6/14/2012',
	},
	data: {},
	grades_timeline: {},
	grades_cumulative: {},
	gpa_timeline: {},
	grade_level: '',
	grading_rules: {
		'Principles of Engineering': {
			'Project': 0.3,
			'Logbook': 0.1,
			'Quiz': 0.2,
			'Partnership': 0.2,
			'Test': 0.2,
		},
		'US History 1': {
			'Quiz': 0.4,
			'Test': 0.6,
		},
		'English 2': {
			'Quiz': 0.2,
			'Homework': 0.1,
			'Writing *': 0.3,
			'Tests/Proj/Pres': 0.4,
		},
		'Physics': {
			'Test': 0.6,
			'Quiz': 0.2,
			'Lab': 0.1,
			'Homework': 0.05,
			'classwork': 0.05,
		},
		'Computer Integrated Mfg.': {
			'Project': 0.5,
			'Homework': 0.1,
			'Quiz': 0.3,
			'Portfolio': 0.1,
			'Mid Term': 0.5,
		},
		'Research Practicum': {
			'X-Other': 0.5,
			'Primary Assessment': 0.5,
		},
		'Data Analysis 2': {
			'Homework': 0.5,
			'Project': 0.5,
		},
		'Health 2': {
			'discussion posts': 0.3,
			'assignments': 0.4,
			'powerpoint/dietbalancer': 0.3,
		},
		'Latin 2': {
			'Quiz': 0.2,
			'Homework': 0.1,
			'Participation': 0.1,
			'Test': 0.3,
			'Project': 0.3,
		},
		'AP Calculus BC': {
			'Test': 0.6,
			'Quiz': 0.3,
			'Homework': 0.1,
		},
		'Physical Education': {
			'Pos Participation': 0.20,
			'Skills': 0.15,
			'Preparation': 0.15,
			'Attitude': 0.20,
			'Test': 0.3,
		},
	},
	credits: {
		'Principles of Engineering': 5,
		'US History 1': 5,
		'English 2': 5,
		'Physics': 6,
		'Computer Integrated Mfg.': 5,
		'Research Practicum': 1,
		'Data Analysis 2': 1,
		'Health 2': 2,
		'Latin 2': 5,
		'AP Calculus BC': 5,
		'Physical Education': 2,
	},
	load: function(xml_data) {
		var this_class = this;
		
		this.initialize();
		
		this.update('Loading grades...', 0);
		this.data = $.parseXML(xml_data);
		console.log(this.data);
		$data = $(this.data);
		
		this.update('Preprocessing grade data...', 0.25);
		this.preprocess($data);
		
		console.log(this.grades_timeline);
		
		this.update('Calculating daily GPA...', 0.5);
		this.calculate_gpa_all($data);
		
		console.log(this.grades_cumulative);
		console.log(this.gpa_timeline);
		
		this.update('Drawing chart...', 0.75);
		this.draw_chart();
	},
	initialized: false,
	initialize: function() {
		if (!this.initialized) {
			this.start_date = new Date(this.start_date).getTime() / (1000 * 60 * 60 * 24);
			this.marking_period_end_dates.MP1 = new Date(this.marking_period_end_dates.MP1).getTime() / (1000 * 60 * 60 * 24) - this.start_date;
			this.marking_period_end_dates.MP2 = new Date(this.marking_period_end_dates.MP2).getTime() / (1000 * 60 * 60 * 24) - this.start_date;
			this.marking_period_end_dates.MP3 = new Date(this.marking_period_end_dates.MP3).getTime() / (1000 * 60 * 60 * 24) - this.start_date;
			this.marking_period_end_dates.MP4 = new Date(this.marking_period_end_dates.MP4).getTime() / (1000 * 60 * 60 * 24) - this.start_date;
			
			this.initialized = true;
		}
	},
	last_percentage: 0,
	update: function(status, percentage) {
		if (percentage != null) {
			this.last_percentage = percentage;
		} else {
			percentage = this.last_percentage;
		}
		
		$('#update').append('<h2>' + percentage*100 + '% - ' + status + '</h2>');
	},
	preprocess: function($data) {
		var this_class = this;
		$data.find('Course').each(function() {
			var course_term = $(this).find('ao\\:CourseTerm, CourseTerm').text();
			if (course_term == this_class.current_course_term) {
				var course_title = $(this).find('CourseTitle').text();
				$(this).find('ao\\:Assignment, Assignment').each(function() {
					var assignment = {};
					assignment.course = course_title;
					assignment.name = $(this).find('ao\\:Name, Name').text();
					assignment.category = $(this).find('ao\\:Category, Category').text();
					assignment.date = $(this).find('ao\\:DueDate, DueDate').text();
					var date = new Date(assignment.date);
					assignment.days = Math.floor((date.getTime() / (1000 * 60 * 60 * 24)) - this_class.start_date);
					
					var grade = $(this).find('ao\\:Grade, Grade').text();
					grade = grade.split('/');
					assignment.grade_earned = grade[0];
					assignment.grade_possible= grade[1];
					
					if (assignment.grade_earned != '--') {
						assignment.grade_earned = parseFloat(assignment.grade_earned);
						assignment.grade_possible = parseFloat(assignment.grade_possible);
						if (assignment.days >= 0 && assignment.days <= 365) {
							if (assignment.days <= this_class.marking_period_end_dates.MP1) {
								assignment.marking_period = 'MP1';
							} else if (assignment.days <= this_class.marking_period_end_dates.MP2) {
								assignment.marking_period = 'MP2';
							} else if (assignment.days <= this_class.marking_period_end_dates.MP3) {
								assignment.marking_period = 'MP3';
							} else if (assignment.days <= this_class.marking_period_end_dates.MP4) {
								assignment.marking_period = 'MP4';
							}
							
							if (typeof(assignment.marking_period) != 'undefined') {
								this_class.obj_array_push(this_class.grades_timeline, assignment.days, assignment);
							}
						}
					}
				});
			}
		});
	},
	calculate_gpa_all: function($data) {
		var this_class = this;
		for (var day in this_class.grades_timeline) {
			var assignments = this_class.grades_timeline[day];
			for (var i=0; i<assignments.length; i++) {
				var assignment = assignments[i];
				
				if (typeof(this_class.grades_cumulative[assignment.marking_period]) == 'undefined') {
					this_class.grades_cumulative[assignment.marking_period] = {};
				}
				
				if (typeof(this_class.grades_cumulative[assignment.marking_period][assignment.course]) == 'undefined') {
					this_class.grades_cumulative[assignment.marking_period][assignment.course] = {};
				}
				
				this_class.obj_array_push(this_class.grades_cumulative[assignment.marking_period][assignment.course], assignment.category, assignment); 
			}
			this_class.calculate_gpa(day);
		}
	},
	obj_array_push: function(object, key, value) {
		if (typeof(object[key]) == 'undefined') {
			object[key] = [];
		}
		object[key].push(value);
	},
	calculate_gpa: function(day) {
		//document.write(day);
		var this_class = this;
		
		var number_of_marking_periods = 0;
		var gpa = 0;
		
		for (var marking_period in this.grades_cumulative) {
			number_of_marking_periods++;
			
			var total_credits = 0;
			var total_grade = 0;
			
			for (var course in this.grades_cumulative[marking_period]) {
				var categories = 0;
				var course_total_grade = 0;
				
				for (var category in this.grades_cumulative[marking_period][course]) {
					var category_total_earned = 0;
					var category_total_possible = 0;
					
					for (var i=0; i<this.grades_cumulative[marking_period][course][category].length; i++) {
						var assignment = this.grades_cumulative[marking_period][course][category][i];
						
						category_total_earned = category_total_earned + assignment.grade_earned;
						category_total_possible = category_total_possible + assignment.grade_possible;
					}
					
					var category_grade = (category_total_earned / category_total_possible) * this.grading_rules[course][category];
					categories = categories + this.grading_rules[course][category];
					course_total_grade = course_total_grade + category_grade;
				}
				
				var course_grade = (course_total_grade / categories) * this.credits[course];
				total_credits = total_credits + this.credits[course];
				total_grade = total_grade + course_grade;
			}
			
			marking_period_average = (total_grade / total_credits);
			gpa = gpa + marking_period_average;
		}
		
		gpa = gpa / number_of_marking_periods;
		//document.write(',' + gpa + '<br />');
		this.gpa_timeline[day] = gpa;
	},
	draw_chart: function() {
		var this_class = this;
		var data = [];
		for (var day in this_class.gpa_timeline) {
			var data_point = [];
			//var d = new Date((parseFloat(this_class.start_date) + parseFloat(day)) * (1000 * 60 * 60 * 24));
			//date_string = d.getMonth() + '/' + d.getDate() + '/' + d.getFullYear();
			date_string = day;
			data_point.push(date_string);
			data_point.push(this_class.gpa_timeline[day]);
			data.push(data_point);
		}
		
		var g_data = google.visualization.arrayToDataTable(data);
		var g_options = {title: 'GPA'};
		
		var g_chart = new google.visualization.LineChart(document.getElementById('chart_div'));
		g_chart.draw(g_data, g_options);
	}
}

function handleDrop(e) {
	e.stopPropagation();
	e.preventDefault();
	console.log('Got file drop.');
	
	var file = e.dataTransfer.files[0];
	var reader = new FileReader();
	
	reader.onload = function(FileReaderEvent) {
		console.log('Load event called.');
		viewer.load(FileReaderEvent.target.result);
	};
	reader.readAsText(file);
}

$(function() {
	console.log('Loaded.');
	document.getElementById('main').addEventListener('drop', handleDrop, false);
});