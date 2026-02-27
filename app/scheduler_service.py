"""
Smart Study Scheduler Service
==============================
Intelligent scheduling algorithm that generates optimal study timetables.

Algorithm Logic:
1. Calculate available weekly hours based on user constraints
2. Assign priority weights to subjects (Weak=3, Medium=2, Strong=1)
3. Distribute hours proportionally across subjects
4. Add revision sessions every 3 days
5. Schedule weekly mock tests
6. Adapt based on performance logs
"""

from datetime import datetime, timedelta, time
from typing import List, Dict, Any
import json


class StudyScheduler:
    """Intelligent study scheduler with adaptive algorithms."""
    
    # Task type constants
    TASK_TYPE_STUDY = "study"
    TASK_TYPE_REVISION = "revision"
    TASK_TYPE_MOCK_TEST = "mock_test"
    TASK_TYPE_PRACTICE = "practice"
    
    # Priority weights
    PRIORITY_WEAK = 3
    PRIORITY_MEDIUM = 2
    PRIORITY_STRONG = 1
    
    # Time constants
    DEFAULT_SESSION_DURATION = 60  # minutes
    MAX_DAILY_HOURS = 4  # prevent burnout
    MIN_SESSION_DURATION = 30
    
    # Study time slots (24-hour format)
    DEFAULT_STUDY_SLOTS = [
        ("06:00", "08:00"),  # Early morning
        ("14:00", "16:00"),  # Afternoon
        ("18:00", "20:00"),  # Evening
        ("20:00", "22:00"),  # Night
    ]
    
    def __init__(self, user_config: Dict[str, Any], subjects: List[Dict[str, Any]]):
        """
        Initialize scheduler with user configuration and subjects.
        
        Args:
            user_config: Dict with daily_hours, college_start, college_end, etc.
            subjects: List of subject dicts with name, priority, weight
        """
        self.user_config = user_config
        self.subjects = subjects
        self.daily_hours = min(user_config.get("daily_hours", 3.0), self.MAX_DAILY_HOURS)
        self.preparation_level = user_config.get("preparation_level", "beginner")
        
    def calculate_weekly_hours(self) -> float:
        """Calculate total available weekly hours."""
        # Weekdays: 5 days, Weekends: 2 days
        # Typically more time on weekends
        weekday_hours = self.daily_hours * 5
        weekend_hours = min(self.daily_hours * 1.5, self.MAX_DAILY_HOURS) * 2
        return weekday_hours + weekend_hours
    
    def get_available_slots(self, day_date: datetime.date) -> List[tuple]:
        """
        Get available time slots for a given day, avoiding college/work hours.
        
        Args:
            day_date: Date to check
            
        Returns:
            List of (start_time, end_time) tuples
        """
        is_weekend = day_date.weekday() >= 5  # Saturday=5, Sunday=6
        
        college_start = self.user_config.get("college_start")
        college_end = self.user_config.get("college_end")
        work_start = self.user_config.get("work_start")
        work_end = self.user_config.get("work_end")
        
        # Use default slots if no constraints
        if not college_start and not work_start:
            return self.DEFAULT_STUDY_SLOTS
        
        # Filter slots based on constraints
        available_slots = []
        for slot_start, slot_end in self.DEFAULT_STUDY_SLOTS:
            # Skip if overlaps with college (on weekdays)
            if not is_weekend and college_start and college_end:
                if self._slots_overlap(slot_start, slot_end, college_start, college_end):
                    continue
            
            # Skip if overlaps with work
            if work_start and work_end:
                if self._slots_overlap(slot_start, slot_end, work_start, work_end):
                    continue
            
            available_slots.append((slot_start, slot_end))
        
        return available_slots if available_slots else [("20:00", "22:00")]
    
    def _slots_overlap(self, start1: str, end1: str, start2: str, end2: str) -> bool:
        """Check if two time slots overlap."""
        s1 = self._time_to_minutes(start1)
        e1 = self._time_to_minutes(end1)
        s2 = self._time_to_minutes(start2)
        e2 = self._time_to_minutes(end2)
        return s1 < e2 and s2 < e1
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes since midnight."""
        h, m = map(int, time_str.split(":"))
        return h * 60 + m
    
    def distribute_hours(self) -> Dict[str, float]:
        """
        Distribute weekly hours across subjects based on priority weights.
        
        Returns:
            Dict mapping subject name to allocated hours
        """
        total_weekly_hours = self.calculate_weekly_hours()
        
        # Reserve time for revision and mock tests
        revision_hours = total_weekly_hours * 0.15  # 15% for revision
        mock_test_hours = 1.5  # 1.5 hours for weekly mock test
        study_hours = total_weekly_hours - revision_hours - mock_test_hours
        
        # Calculate total weight
        total_weight = sum(s["weight"] for s in self.subjects)
        
        # Distribute proportionally
        allocation = {}
        for subject in self.subjects:
            if total_weight > 0:
                subject_hours = (subject["weight"] / total_weight) * study_hours
                allocation[subject["subject_name"]] = round(subject_hours, 2)
            else:
                allocation[subject["subject_name"]] = 0
        
        return allocation
    
    def generate_weekly_schedule(self, week_start_date: datetime.date) -> List[Dict[str, Any]]:
        """
        Generate a complete weekly schedule.
        
        Args:
            week_start_date: Monday of the week
            
        Returns:
            List of task dictionaries
        """
        tasks = []
        allocation = self.distribute_hours()
        
        # Generate study tasks for each subject
        tasks.extend(self._create_subject_tasks(week_start_date, allocation))
        
        # Add revision sessions (every 3 days)
        tasks.extend(self._create_revision_tasks(week_start_date))
        
        # Add weekly mock test (usually Friday or Saturday)
        tasks.extend(self._create_mock_test_task(week_start_date))
        
        # Sort by date and time
        tasks.sort(key=lambda t: (t["date"], t["time"]))
        
        return tasks
    
    def _create_subject_tasks(
        self, week_start: datetime.date, allocation: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """Create study tasks for each subject."""
        tasks = []
        
        for subject_name, hours in allocation.items():
            if hours <= 0:
                continue
                
            # Get subject details
            subject = next((s for s in self.subjects if s["subject_name"] == subject_name), None)
            if not subject:
                continue
            
            # Convert hours to number of sessions
            num_sessions = int(hours * 60 / self.DEFAULT_SESSION_DURATION)
            
            # Distribute across the week
            days_spread = min(num_sessions, 5)  # Max 5 weekdays
            current_date = week_start
            session_count = 0
            
            for day_offset in range(7):
                if session_count >= num_sessions:
                    break
                
                current_date = week_start + timedelta(days=day_offset)
                
                # Skip Sunday usually
                if current_date.weekday() == 6:
                    continue
                
                # Get available slots for this day
                slots = self. get_available_slots(current_date)
                if not slots:
                    continue
                
                # Pick a slot (rotate through available slots)
                slot = slots[session_count % len(slots)]
                
                tasks.append({
                    "date": current_date.isoformat(),
                    "time": slot[0],
                    "subject": subject_name,
                    "topic": self._generate_topic(subject, session_count),
                    "type": self.TASK_TYPE_STUDY,
                    "duration_minutes": self.DEFAULT_SESSION_DURATION,
                })
                
                session_count += 1
        
        return tasks
    
    def _create_revision_tasks(self, week_start: datetime.date) -> List[Dict[str, Any]]:
        """Create revision tasks (every 3 days)."""
        tasks = []
        
        # Add revision on Wednesday and Saturday
        revision_days = [2, 5]  # Wednesday, Saturday
        
        for day_offset in revision_days:
            current_date = week_start + timedelta(days=day_offset)
            slots = self.get_available_slots(current_date)
            
            if slots:
                # Pick evening slot for revision
                revision_slot = slots[-1] if len(slots) > 1 else slots[0]
                
                tasks.append({
                    "date": current_date.isoformat(),
                    "time": revision_slot[0],
                    "subject": "Mixed Revision",
                    "topic": "Review weak areas",
                    "type": self.TASK_TYPE_REVISION,
                    "duration_minutes": 45,
                })
        
        return tasks
    
    def _create_mock_test_task(self, week_start: datetime.date) -> List[Dict[str, Any]]:
        """Create weekly mock test task."""
        # Schedule on Saturday
        mock_date = week_start + timedelta(days=5)
        slots = self.get_available_slots(mock_date)
        
        if not slots:
            return []
        
        # Pick afternoon slot for mock test
        mock_slot = slots[1] if len(slots) > 1 else slots[0]
        
        return [{
            "date": mock_date.isoformat(),
            "time": mock_slot[0],
            "subject": "Full Mock Test",
            "topic": "Complete assessment",
            "type": self.TASK_TYPE_MOCK_TEST,
            "duration_minutes": 90,
        }]
    
    def _generate_topic(self, subject: Dict, session_number: int) -> str:
        """Generate topic name based on session number."""
        topics = {
            "DSA": ["Arrays & Strings", "Linked Lists", "Trees", "Graphs", "DP", "Greedy"],
            "Aptitude": ["Quantitative", "Logical Reasoning", "Verbal", "Data Interpretation"],
            "Core CS": ["OS Concepts", "DBMS", "Networks", "OOP"],
            "Programming": ["Java Basics", "Python", "Problem Solving", "Code Practice"],
        }
        
        subject_name = subject["subject_name"]
        default_topics = [f"Topic {session_number + 1}", "Practice", "Concepts", "Problems"]
        
        topic_list = topics.get(subject_name, default_topics)
        return topic_list[session_number % len(topic_list)]
    
    def adapt_schedule(self, performance_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Adapt subject weights based on recent performance.
        
        Args:
            performance_data: List of recent performance logs
            
        Returns:
            Dict mapping subject name to new weight
        """
        adjustments = {}
        
        for subject in self.subjects:
            subject_name = subject["subject_name"]
            current_weight = subject["weight"]
            
            # Find performance for this subject
            subject_perf = [p for p in performance_data if p.get("subject") == subject_name]
            
            if not subject_perf:
                adjustments[subject_name] = current_weight
                continue
            
            # Calculate average mock score
            mock_scores = [p.get("mock_score", 0) for p in subject_perf if p.get("mock_score")]
            avg_score = sum(mock_scores) / len(mock_scores) if mock_scores else 0
            
            # Adjustment logic
            new_weight = current_weight
            
            if avg_score < 40:
                # Very weak - increase weight significantly
                new_weight = min(current_weight + 1, self.PRIORITY_WEAK)
            elif avg_score < 60:
                # Weak - slight increase
                new_weight = current_weight
            elif avg_score > 80:
                # Strong - can reduce weight
                new_weight = max(current_weight - 1, self.PRIORITY_STRONG)
            
            adjustments[subject_name] = new_weight
        
        return adjustments
    
    def suggest_focus_areas(self, performance_data: List[Dict[str, Any]]) -> List[str]:
        """
        Suggest areas that need more focus based on performance.
        
        Returns:
            List of recommendation strings
        """
        suggestions = []
        
        for subject in self.subjects:
            subject_name = subject["subject_name"]
            subject_perf = [p for p in performance_data if p.get("subject") == subject_name]
            
            if not subject_perf:
                continue
            
            # Check completion rate
            total_tasks = sum(p.get("tasks_total", 0) for p in subject_perf)
            completed_tasks = sum(p.get("tasks_completed", 0) for p in subject_perf)
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            if completion_rate < 50:
                suggestions.append(
                    f"⚠️ {subject_name}: Low completion rate ({completion_rate:.0f}%). Try shorter study sessions."
                )
            
            # Check mock scores
            mock_scores = [p.get("mock_score", 0) for p in subject_perf if p.get("mock_score")]
            if mock_scores:
                avg_score = sum(mock_scores) / len(mock_scores)
                if avg_score < 60:
                    suggestions.append(
                        f"📚 {subject_name}: Score needs improvement ({avg_score:.0f}%). Schedule extra practice."
                    )
                elif avg_score > 85:
                    suggestions.append(
                        f"✨ {subject_name}: Excellent progress ({avg_score:.0f}%)! Maintain consistency."
                    )
        
        return suggestions


def calculate_readiness_score(
    subjects: List[Dict[str, Any]],
    performance_data: List[Dict[str, Any]],
    streak_data: Dict[str, int]
) -> Dict[str, Any]:
    """
    Calculate overall placement readiness score (0-100).
    
    Factors:
    - Subject performance (60%)
    - Study consistency/streak (25%)
    - Mock test scores (15%)
    
    Returns:
        Dict with score, level, and breakdown
    """
    # Subject performance score
    if subjects:
        avg_subject_perf = sum(s.get("performance_score", 0) for s in subjects) / len(subjects)
    else:
        avg_subject_perf = 0
    
    # Consistency score (based on streak)
    current_streak = streak_data.get("current_streak", 0)
    consistency_score = min(current_streak * 5, 100)  # Max 100
    
    # Mock test score
    mock_perf = [p for p in performance_data if p.get("mock_score")]
    if mock_perf:
        avg_mock = sum(p["mock_score"] for p in mock_perf) / len(mock_perf)
    else:
        avg_mock = 0
    
    # Weighted total
    total_score = (
        avg_subject_perf * 0.60 +
        consistency_score * 0.25 +
        avg_mock * 0.15
    )
    
    # Determine level
    if total_score >= 80:
        level = "Placement Ready"
        emoji = "🚀"
    elif total_score >= 60:
        level = "Almost There"
        emoji = "💪"
    elif total_score >= 40:
        level = "Building Momentum"
        emoji = "📈"
    else:
        level = "Getting Started"
        emoji = "🌱"
    
    return {
        "score": round(total_score, 1),
        "level": level,
        "emoji": emoji,
        "breakdown": {
            "subject_performance": round(avg_subject_perf, 1),
            "consistency": round(consistency_score, 1),
            "mock_tests": round(avg_mock, 1),
        }
    }
