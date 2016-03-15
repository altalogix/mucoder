---
title: "Consuming a headless Juce C++ audio library from a Xamarin CocosSharp game UI - Part 3"
bg: grey
color: black
date: 2015-11-19 08:00:03
group: blog
type: blogpost
layout: blogpost
author: Leo Olivers
---

**[Update: The Android-related techniques in this article series work fine with Juce 3.3.  However, Juce 4.x introduced a new Android startup activity which does not play well with a headless audio library.  So far no workaround is known yet, but I'll update these articles as soon as there is one.]**

(Sample code for this article is available at [github.com/altalogix/CocosJuce](http://github.com/altalogix/CocosJuce))

In the [previous](/blog/2015/11/19/cocosjuce-part2.html) posts of this series we showed how to build a headless Juce audio library in C++ and consume it from
a Xamarin CocosSharp C# game UI. As a bonus, we'll discuss now how you could consume that same audio library from a more native-looking, non-game UI using Xamarin.Forms.

## Native-looking mobile UI options

OK, sometimes a game UI, with fast framerates and colorful animations is not what you want, and instead, you are looking for a more prosaic, native-looking mobile UI.

If it has to have a native look, then this rules out building the UI with Juce itself, since Juce renders with its own look&feel, and typically does not use native controls for its UI.

Obviously, one way of getting there is to just use native mobile UI toolkits and interop with our Juce audio library from there.
For instance on iOS you can directly call C/C++ from your Objective C source. Or import the C/C++ interface into Swift and call it from there.
On Android you can use the NDK to develop in C++, and therefore easily access your own C/C++ lib.
It becomes a bit trickier when just using the Android SDK, in Java - in that case you'd need to expose your C functions via JNI interop, 

Here though we are in Xamarin-land, writing our UI in C#, so none of the above options are available to us.
In Xamarin you basically have two options for developing your mobile UI (ignoring the CocosSharp game UI we already discussed).  One is to develop it against native APIs which Xamarin 
conveniently provides C# interop assemblies for.  So this is just like you would do it in Java on Android or ObjectiveC/Swift on iOS,
but using C# syntax instead of Java/ObjectiveC/Swift.
This gives you similarly fine-grained control over the UI as you'd have with native toolsets.  
But, like with native toolsets, it also implies building your UI twice, since Android and iOS UI APIs are totally different.

The second Xamarin option is to use a cross-platform UI abstraction called Xamarin.Forms. In that case you'll write your UI only once 
(well, let's say 90% to be honest, since some form of platform-dependent tweaking will probably be needed anyway),
and then share that same code between both Android and iOS. Such a Xamarin.Forms-based UI will still look native though,
since under the hood it will employ the native controls and APIs provided by each platform.

So which one is best? 

If you need the maximum amount of control over your UI, and/or use the latest APIs for the most trendy new UI look, then
you'd best skip Xamarin.Forms and invest in writing against the native APIs. A good example would be
when you're competing against the slickest new apps in the app stores and you 
will be judged mercilessly on how polished and fluid your UI is compared to the competition.

However, if you are in a context where the users care more about how fast they can get new functionality,
at a low budget, and on all major device types at once, then Xamarin.Forms looks more like the ticket.
A good example being an LOB client app that performs a prosaic, but essential service to your business 
customers.

In this post I have chosen Xamarin.Forms for simplicity and timing reasons.

## Xamarin.Forms and Juce audio

When you download the sample code (link above) you'll find the Xamarin solution `CocosJuceFormsApp.sln` in the `CocosJuce/CocosJuceFormsApp` folder.
You can open this solution either with Xamarin Studio (Indie plan) or Visual Studio 2013 or higher (Business plan).

<a href="/img/2015-11-19-cocosjuce/cocosjuceformsapp.png" class="swipebox" title="cocosjuce Xamarin.Forms projects">
<img src="/img/2015-11-19-cocosjuce/cocosjuceformsapp.png" alt="cocosjuceformsapp" ></a>

Note that the solution name is perhaps a bit confusing here: although named *CocosJuceFormsApp*, it has *nothing to do whatsoever* with CocosSharp 
or any game-related stuff.

The solution contains three projects:

|                      |                  |
| -------------------- | --------------------- |
| `CocosJuceFormsApp`       | Shared code, containing UI implementation          |
| `CocosJuceFormsApp.Droid`      | Android-specific code   |
| `CocosJuceFormsApp.iOS`        | iOS-specific code     |

The last two of these are platform-specific projects, for Android and iOS resp.
These projects contain mainly start-up code needed for launching and initializing the app.
The first project contains the actual UI code, written against the Xamarin.Forms cross-platform UI API.

#### What's different compared to a CocosSharp UI?

Obviously there is no longer a dependency on any CocosSharp assemblies.
Instead the Android launch activity now derives from `Xamarin.Forms.Platform.Android.FormsApplicationActivity`.
Likewise the iOS AppDelegate now derives from `Xamarin.Forms.Platform.iOS.FormsApplicationDelegate`.
The real work is then done by the Xamarin.Forms `App.cs` class in the shared project and the UI is
written once in the `TestTonePage.cs` class, also residing in the shared project.

All the integration with our Juce audio lib remains identical to the CocosSharp version.
So we still have a `CocosJuce.Api.cs` interop class on both platforms. And on Android we still
integrate the `JuceActivity.java` and `JuceActivity.cs` interop classes.
Also, inclusion of the library binaries in the projects is identical, as are the additional
mtouch arguments for iOS.

As a result the resulting UI now has a native look & feel:

##### Android

<a href="/img/2015-11-19-cocosjuce/xamformsaniandroid.gif" class="swipebox" title="cocosjuce Xamarin.Forms Android">
<img src="/img/2015-11-19-cocosjuce/xamformsaniandroid.gif" alt="xamforms android" ></a>

##### iOS

<a href="/img/2015-11-19-cocosjuce/xamformsaniios.gif" class="swipebox" title="cocosjuce Xamarin.Forms iOS">
<img src="/img/2015-11-19-cocosjuce/xamformsaniios.gif" alt="xamforms ios" ></a>

## Wrapping up

That's all there is to it to consuming a Juce audio library from a non-game UI in Xamarin.
If you have any further questions, I recommend having a look at the sample source code (link at the top of this article).
Feel free to send me an email to support@mucoder.net if you have any other questions or remarks.



 