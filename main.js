var viewer = {
	current_course_term: '11-12',
	start_date: new Date('9/6/2011').getTime(),
	data: {},
	grades_timeline: {},
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
		'Computer Integrated Mfg.': {
			'Project': 0.5,
			'Homework': 0.1,
			'Quiz': 0.3,
			'Portfolio': 0.1,
		},
	},
	load: function(xml_data) {
		var this_class = this;
		
		this.update('Loading grades...', 0);
		this.data = $.parseXML(xml_data);
		console.log(this.data);
		$data = $(this.data);
		
		this.update('Preprocessing grade data...', 0.2);
		this.preprocess($data);
		
		console.log(this.grades_timeline);
		
		this.update('Calculating daily GPA...', 0.5);
		this.calculate_gpa_all($data);
	},
	last_percentage: 0,
	update: function(status, percentage) {
		if (percentage != null) {
			this.last_percentage = percentage;
		} else {
			percentage = this.last_percentage;
		}
		
		console.log(percentage*100 + '% - ' + status);
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
					assignment.days = Math.floor((date.getTime() - this_class.start_date) / (1000 * 60 * 60 * 24));
					
					var grade = $(this).find('ao\\:Grade, Grade').text();
					grade = grade.split('/');
					assignment.grade_earned = grade[0];
					assignment.grade_possible= grade[1];
					
					if (assignment.days >= 0 && assignment.days <= 365) {
						if (typeof(this_class.grades_timeline[assignment.days]) == 'undefined') {
							this_class.grades_timeline[assignment.days] = [];
						}
						this_class.grades_timeline[assignment.days].push(assignment);
					}
				});
			}
		});
	},
	calculate_gpa_all: function($data) {
		
	},
	calculate_gpa: function($data) {
		
	},
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