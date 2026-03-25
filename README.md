# Purr Greetings

Purr Greetings started as a simple "Hello World" project for learning React Native. As development continued, the coder realized she already knew more JavaScript than she expected, and the project quickly grew beyond its original goal.

The app evolved into a messaging app focused on sending messages with or without images in an accessible way. It has a cat theme and includes in-app purchases where users can buy the cats good coffee or lousy coffee as a fun monetization feature.

Purr Greetings is currently published on the iOS App Store.

---

## Accessibility

Accessibility was a core design goal for Purr Greetings.

The most important feature was ensuring the app works well with screen readers. Messages are designed so that images are optional, allowing users to communicate clearly with text alone.

When images are included in a message, the sender can also add alt text describing the image. This allows screen reader users to understand the image content through the sender’s own description.

The messaging system was also designed so that adding, deleting, or changing images does not affect the message itself, ensuring that the text portion of the message always remains accessible.

The cats in the app are based on real cats. While the color palette was not specifically designed for color-blind accessibility, the visual designs were inspired by the natural coloring of the cats themselves.

---

## Technology Used

Purr Greetings was built using **React Native**, allowing the project to be written using JavaScript. Development was done using **Expo** and **Visual Studio Code**.

**Firebase** was used to monitor in-app activity, specifically tracking how many good and lousy coffees were purchased so the app could trigger milestone events.

**Apple In-App Purchases (IAP)** were implemented for monetization and to support the milestone system tied to coffee purchases.

---

## What I'm Proud Of

There are several things about this project that I’m especially proud of.

The first is that **Purr Greetings became my first app published on the Apple App Store**.

The second is that the project was designed **with accessibility first in mind**, including screen reader support and alt text for images in messages.

Finally, I enjoyed building the many fun animations in the app, including the SVG animation where **Compie’s frown gradually turns into a smile**.

---

## Characters

Purr Greetings includes several characters that appear throughout the app and milestone animations.

**Compie** is a grumpy laptop who rarely smiles. The only thing that can make him smile is when Zoey hugs him.

**Zoey** is a zebra who currently has black and white stripes and wears a shirt that says *"Free Hugs."* She will eventually be updated to have red stripes after the developer discovered she has a unique genetic variant, making Zoey a symbol of uniqueness.

**Rosie** is a tuxedo cat who loves good coffee, bow ties, and caffeine. She works in the milestone system and enthusiastically celebrates when users buy good coffee.

**Ruffles** is a calico cat who accepts the lousy coffee that Rosie refuses to drink. Ruffles is portrayed as a student in the milestone system.

---

## Animation

Some of the character animations were created using **SVG Bézier curves**. One example is Compie’s facial expression changing from a frown to a smile when Zoey hugs him.

The animation works by gradually raising the control points of the mouth curve, transforming the shape smoothly over time.

---

## Why Lousy Coffee?

When I first created Purr Greetings, I planned to use the external website “Buy Me a Coffee” for monetization. Since I don’t drink coffee, I was going to change the idea to **“Buy Rosie a Treat.”**

Before I had a chance to implement it, Loretta Swit passed away. I have always been a fan of *M\*A\*S\*H*, where she was most famous for playing Margaret “Hot Lips” Houlihan. One of her most memorable scenes appears in her favorite episode, **“The Nurses.”** In that episode she explains how the nurses don’t include her or ask for her advice. The line that stands out most is when she says:

> “Did you ever even bother to offer me a lousy cup of coffee?”

The nurses admit they never did because they assumed she wouldn’t accept. By the end of the episode they finally do offer her a lousy cup of coffee.

In honor of Loretta Swit and that scene, I decided to change the original “Buy Rosie a Treat” idea into **“Buy Me a Lousy Cup of Coffee.”** For me, it represents a small way of feeling included.

As the app developed, the idea became part of the characters. **Rosie** gets the good coffee (caffeinated), while **Ruffles** gets the lousy coffee (decaf). The system also evolved into in-app purchases so the app can track how many good and lousy coffees are bought and trigger milestone events.

---

## Purpose of this Repository

This repository exists for several reasons.

It serves as a **portfolio project** showing how the Purr Greetings app was designed and built. It is also intended as a **learning resource** for people interested in React Native, accessibility-first design, and creative app development.

Developers are welcome to explore how the project works, learn from the code, and potentially contribute ideas or improvements.