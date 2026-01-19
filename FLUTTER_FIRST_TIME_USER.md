# Flutter App - First Time User Detection Guide

## 📋 Overview (Samajh)

Jab user **Flutter app mein login hota hai**, to system automatically check karta hai:
- **Kya yeh first time user hai?**
- **Kya onboarding dikhani hai?**

Frontend developer ko easily pata chal jayega ki user first time hai ya nahi.

---

## 🔄 Complete Flow

### Step 1: User Login Hota Hai
- User Google Sign-In ya Email/Password se login karta hai
- Backend se JWT token milta hai
- Token store ho jata hai

### Step 2: Login Ke Baad Status Check
- Login successful hone ke baad
- Backend API call: `GET /api/auth/check-status`
- Response mein `isFirstTime` aur `needsOnboarding` milta hai

### Step 3: First Time User Check
- Agar `isFirstTime === true`:
  - Onboarding screen dikhao
  - User ko app ka introduction do
- Agar `isFirstTime === false`:
  - Direct home screen dikhao

### Step 4: Onboarding Complete
- User "Get Started" click kare
- Backend API call: `POST /api/auth/complete-onboarding`
- Onboarding complete mark ho jata hai

---

## 📱 Flutter Implementation

### Step 1: Service Class Banayein

`lib/services/first_time_user_service.dart` file banayein:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class FirstTimeUserService {
  final String baseUrl = 'https://fataapp-delta.vercel.app';

  /// Check if user is first time user
  /// Returns: {
  ///   'isFirstTime': bool,
  ///   'needsOnboarding': bool,
  ///   'onboardingCompleted': bool,
  ///   'user': {...}
  /// }
  Future<Map<String, dynamic>> checkUserStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('authToken');

      if (token == null) {
        return {
          'isFirstTime': true,
          'needsOnboarding': true,
          'onboardingCompleted': false,
          'error': 'Not authenticated'
        };
      }

      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/check-status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'isFirstTime': data['isFirstTime'] ?? false,
          'needsOnboarding': data['needsOnboarding'] ?? false,
          'onboardingCompleted': data['onboardingCompleted'] ?? false,
          'user': data['user'],
          'success': true,
        };
      } else {
        final errorData = jsonDecode(response.body);
        return {
          'isFirstTime': true,
          'needsOnboarding': true,
          'onboardingCompleted': false,
          'error': errorData['message'] ?? 'Failed to check status',
        };
      }
    } catch (e) {
      print('Error checking user status: $e');
      return {
        'isFirstTime': true,
        'needsOnboarding': true,
        'onboardingCompleted': false,
        'error': e.toString(),
      };
    }
  }

  /// Mark onboarding as completed
  Future<bool> completeOnboarding() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('authToken');

      if (token == null) {
        return false;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/complete-onboarding'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        print('Failed to complete onboarding: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('Error completing onboarding: $e');
      return false;
    }
  }
}
```

### Step 2: Login Screen Mein Use Karein

`lib/screens/login_screen.dart`:

```dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/first_time_user_service.dart';
import '../screens/onboarding_screen.dart';
import '../screens/home_screen.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _authService = AuthService();
  final FirstTimeUserService _firstTimeService = FirstTimeUserService();
  bool _isLoading = false;

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    
    try {
      // Step 1: Google Sign-In
      final result = await _authService.signInWithGoogle();
      
      if (result != null) {
        // Step 2: Login successful, ab check karo first time user hai ya nahi
        final status = await _firstTimeService.checkUserStatus();
        
        // Step 3: Navigate based on status
        if (mounted) {
          if (status['needsOnboarding'] == true) {
            // First time user - Onboarding dikhao
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => OnboardingScreen(
                  onComplete: () async {
                    await _firstTimeService.completeOnboarding();
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (context) => HomeScreen()),
                    );
                  },
                ),
              ),
            );
          } else {
            // Existing user - Direct home screen
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => HomeScreen()),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Welcome to FantaBeach'),
            SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _handleGoogleSignIn,
              icon: Icon(Icons.login),
              label: Text('Sign in with Google'),
            ),
            if (_isLoading) CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
```

### Step 3: Onboarding Screen Banayein

`lib/screens/onboarding_screen.dart`:

```dart
import 'package:flutter/material.dart';

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onComplete;

  OnboardingScreen({required this.onComplete});

  @override
  _OnboardingScreenState createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      title: 'Welcome to FantaBeach!',
      description: 'Create your fantasy team and compete with others',
      image: 'assets/onboarding_1.png',
    ),
    OnboardingPage(
      title: 'Choose Your Players',
      description: 'Select your favorite players and build your dream team',
      image: 'assets/onboarding_2.png',
    ),
    OnboardingPage(
      title: 'Join Leagues',
      description: 'Compete in public or private leagues',
      image: 'assets/onboarding_3.png',
    ),
    OnboardingPage(
      title: 'Win Prizes',
      description: 'Earn credits and win exciting prizes',
      image: 'assets/onboarding_4.png',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: EdgeInsets.all(16),
                child: TextButton(
                  onPressed: widget.onComplete,
                  child: Text('Skip'),
                ),
              ),
            ),

            // Page view
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  return _buildPage(_pages[index]);
                },
              ),
            ),

            // Indicators
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _pages.length,
                (index) => _buildIndicator(index == _currentPage),
              ),
            ),

            SizedBox(height: 20),

            // Next/Get Started button
            Padding(
              padding: EdgeInsets.all(20),
              child: ElevatedButton(
                onPressed: () {
                  if (_currentPage < _pages.length - 1) {
                    _pageController.nextPage(
                      duration: Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  } else {
                    widget.onComplete();
                  }
                },
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                ),
                child: Text(
                  _currentPage == _pages.length - 1 ? 'Get Started' : 'Next',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPage(OnboardingPage page) {
    return Padding(
      padding: EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Image placeholder (apni images add karein)
          Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(Icons.image, size: 100, color: Colors.grey[600]),
          ),
          SizedBox(height: 40),
          Text(
            page.title,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 20),
          Text(
            page.description,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildIndicator(bool isActive) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 4),
      width: isActive ? 24 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: isActive ? Colors.blue : Colors.grey[300],
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}

class OnboardingPage {
  final String title;
  final String description;
  final String image;

  OnboardingPage({
    required this.title,
    required this.description,
    required this.image,
  });
}
```

### Step 4: Auth Service Update Karein

`lib/services/auth_service.dart` mein login ke baad status check add karein:

```dart
// Login ke baad yeh function call karein
Future<void> handleLoginSuccess() async {
  final firstTimeService = FirstTimeUserService();
  final status = await firstTimeService.checkUserStatus();
  
  if (status['needsOnboarding'] == true) {
    // Navigate to onboarding
  } else {
    // Navigate to home
  }
}
```

---

## 🎯 Simple Usage Example

### Complete Login Flow:

```dart
// Login button click pe
Future<void> login() async {
  // 1. Google Sign-In
  final authResult = await authService.signInWithGoogle();
  
  if (authResult != null) {
    // 2. Check first time user
    final status = await firstTimeUserService.checkUserStatus();
    
    // 3. Navigate accordingly
    if (status['isFirstTime'] == true) {
      // Show onboarding
      Navigator.push(context, MaterialPageRoute(
        builder: (_) => OnboardingScreen(
          onComplete: () async {
            await firstTimeUserService.completeOnboarding();
            Navigator.pushReplacement(context, 
              MaterialPageRoute(builder: (_) => HomeScreen()));
          },
        ),
      ));
    } else {
      // Go to home
      Navigator.pushReplacement(context,
        MaterialPageRoute(builder: (_) => HomeScreen()));
    }
  }
}
```

---

## 🔌 Backend API Endpoints

### 1. Check User Status

**Endpoint:** `GET https://fataapp-delta.vercel.app/api/auth/check-status`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "isFirstTime": true,
  "needsOnboarding": true,
  "onboardingCompleted": false,
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "name": "User Name",
    "profilePicture": "https://...",
    "isVerified": true
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "User not authenticated",
  "isFirstTime": true,
  "needsOnboarding": true
}
```

### 2. Complete Onboarding

**Endpoint:** `POST https://fataapp-delta.vercel.app/api/auth/complete-onboarding`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "onboardingCompleted": true,
    ...
  }
}
```

---

## 📝 Complete Example (Full Code)

### main.dart

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FantaBeach',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: LoginScreen(),
    );
  }
}
```

### login_screen.dart (Complete)

```dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/first_time_user_service.dart';
import '../screens/onboarding_screen.dart';
import '../screens/home_screen.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _authService = AuthService();
  final FirstTimeUserService _firstTimeService = FirstTimeUserService();
  bool _isLoading = false;

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    
    try {
      // Step 1: Google Sign-In
      final result = await _authService.signInWithGoogle();
      
      if (result != null) {
        // Step 2: Check if first time user
        final status = await _firstTimeService.checkUserStatus();
        
        print('User Status:');
        print('  - isFirstTime: ${status['isFirstTime']}');
        print('  - needsOnboarding: ${status['needsOnboarding']}');
        print('  - onboardingCompleted: ${status['onboardingCompleted']}');
        
        if (mounted) {
          if (status['needsOnboarding'] == true) {
            // First time user - Show onboarding
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => OnboardingScreen(
                  onComplete: () async {
                    final success = await _firstTimeService.completeOnboarding();
                    if (success && mounted) {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (context) => HomeScreen()),
                      );
                    }
                  },
                ),
              ),
            );
          } else {
            // Existing user - Go to home
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => HomeScreen()),
            );
          }
        }
      }
    } catch (e) {
      print('Login Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('FantaBeach')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Welcome to FantaBeach',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 40),
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _handleGoogleSignIn,
              icon: Icon(Icons.login),
              label: Text('Sign in with Google'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 30, vertical: 15),
              ),
            ),
            if (_isLoading) ...[
              SizedBox(height: 20),
              CircularProgressIndicator(),
            ],
          ],
        ),
      ),
    );
  }
}
```

---

## ✅ Implementation Steps

1. **Service Class Banayein**
   - `lib/services/first_time_user_service.dart` file banayein
   - Code copy karein

2. **Login Screen Update Karein**
   - Login successful hone ke baad `checkUserStatus()` call karein
   - Response check karein: `isFirstTime` aur `needsOnboarding`

3. **Onboarding Screen Banayein**
   - `lib/screens/onboarding_screen.dart` banayein
   - Design apne according customize karein

4. **Navigation Setup Karein**
   - First time user → Onboarding screen
   - Existing user → Home screen

5. **Complete Onboarding**
   - User "Get Started" click kare
   - `completeOnboarding()` call karein
   - Home screen pe navigate karein

---

## 🎯 Key Points

1. **Login Ke Baad Check:** Login successful hone ke baad immediately status check karein
2. **Simple Condition:** `if (status['needsOnboarding'] == true)` - bas itna check karna hai
3. **One Time Only:** Onboarding sirf ek baar dikhaya jata hai
4. **Skip Option:** User skip kar sakta hai
5. **Backend Ready:** Backend endpoints already working hain

---

## 🚀 Quick Test

1. **New User Login:**
   - Google Sign-In karein
   - Onboarding screen dikhna chahiye

2. **Existing User Login:**
   - Google Sign-In karein
   - Direct home screen dikhna chahiye

3. **Complete Onboarding:**
   - Onboarding complete karein
   - Next time login pe onboarding nahi dikhna chahiye

---

## 📞 Support

Agar koi issue ho:
1. Check karein ki JWT token properly store ho raha hai
2. Backend API response check karein
3. Console logs check karein
4. Error messages carefully read karein

---

**Note:** Yeh complete Flutter implementation hai. Step-by-step follow karein aur easily integrate kar sakte hain! 🚀

