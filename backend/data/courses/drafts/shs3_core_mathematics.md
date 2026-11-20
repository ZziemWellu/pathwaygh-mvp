---
slug: shs3-maths-number-bases
title: Number bases
course: shs3-core-mathematics
course_title: SHS 3 Core Mathematics (draft)
course_description: Short lessons on the most-examined WASSCE core mathematics topics, each with a worked example and a Try it. Drafts, not yet checked by a teacher.
level: shs
description: Convert between base ten and other bases.
syllabus_topic: shs3.maths.number.number-bases
order: 0
duration_minutes: 10
---
# Number bases

In base ten the place values are 1, 10, 100, ... In **base two** they are 1, 2, 4, 8, 16, ... and in **base five** they are 1, 5, 25, 125, ...

- **To base ten:** multiply each digit by its place value and add.
- **From base ten:** divide repeatedly by the new base and read the remainders from the bottom up.

## Worked example

**Convert 1011 (base two) to base ten.** 1 x 8 + 0 x 4 + 1 x 2 + 1 x 1 = **11**.

**Convert 34 (base five) to base ten.** 3 x 5 + 4 = **19**.

**Convert 25 to base two.** 25 ÷ 2 = 12 r 1; 12 ÷ 2 = 6 r 0; 6 ÷ 2 = 3 r 0; 3 ÷ 2 = 1 r 1; 1 ÷ 2 = 0 r 1. Reading upwards: **11001**. Check: 16 + 8 + 1 = 25.

## Try it

1. Convert 110 (base two) to base ten.
2. Convert 13 to base two.

*(Answers: 1. 4 + 2 = 6. 2. 1101, because 8 + 4 + 1 = 13.)*
---
slug: shs3-maths-indices-logarithms
title: Indices and logarithms
course: shs3-core-mathematics
description: Laws of indices, fractional indices and the laws of logarithms.
syllabus_topic: shs3.maths.number.indices-logarithms
order: 1
duration_minutes: 12
---
# Indices and logarithms

**Laws of indices**

- aᵐ x aⁿ = aᵐ⁺ⁿ and aᵐ ÷ aⁿ = aᵐ⁻ⁿ
- (aᵐ)ⁿ = aᵐⁿ
- a⁰ = 1 and a⁻ⁿ = 1/aⁿ
- a^(m/n) = (n-th root of a)ᵐ

**Logarithms:** log_b x = y means bʸ = x. The laws are log a + log b = log ab, log a - log b = log (a/b) and log aⁿ = n log a.

## Worked example

1. 2³ x 2⁴ = 2⁷ = **128**
2. 8^(2/3): the cube root of 8 is 2, and 2² = **4**
3. log₁₀ 1000 = **3**, because 10³ = 1000
4. log 2 + log 5 = log 10 = **1** (base ten)

## Try it

1. Evaluate 27^(2/3).
2. Evaluate log₃ 81.

*(Answers: 1. The cube root of 27 is 3, and 3² = 9. 2. 4, because 3⁴ = 81.)*
---
slug: shs3-maths-sets
title: Sets and Venn diagrams
course: shs3-core-mathematics
description: Use Venn diagrams to solve problems with two sets.
syllabus_topic: shs3.maths.number.sets
order: 2
duration_minutes: 10
---
# Sets and Venn diagrams

For two sets A and B:

n(A ∪ B) = n(A) + n(B) - n(A ∩ B)

A ∩ B (the intersection) holds what is in both sets; A ∪ B (the union) holds what is in either.

Draw a Venn diagram and fill in the **intersection first**.

## Worked example

In a class of 40 students, each plays at least one of football and volleyball. 25 play football and 20 play volleyball. How many play both?

- 40 = 25 + 20 - n(both), so n(both) = 45 - 40 = **5**
- Football only = 25 - 5 = 20; volleyball only = 20 - 5 = 15. Check: 20 + 15 + 5 = 40.

## Try it

Of 30 students, each studying at least one of Biology and Chemistry, 18 study Biology and 16 study Chemistry. How many study both?

*(Answer: 18 + 16 - 30 = 4.)*
---
slug: shs3-maths-commercial-arithmetic
title: Simple and compound interest, profit and loss
course: shs3-core-mathematics
description: Interest, amounts and percentage profit.
syllabus_topic: shs3.maths.number.commercial-arithmetic
order: 3
duration_minutes: 12
---
# Simple and compound interest, profit and loss

- **Simple interest:** I = PRT ÷ 100. The amount = P + I.
- **Compound interest:** the interest is added each year, so next year's interest is worked out on the new amount.
- **Percentage profit** = profit ÷ cost price x 100.

## Worked example

**Simple interest on GH₵ 1,500 at 8% per annum for 3 years:** 1,500 x 8 x 3 ÷ 100 = GH₵ 360, so the amount is **GH₵ 1,860**.

**GH₵ 2,000 at 10% compound interest for 2 years:**

- After year 1: 2,000 + 10% of 2,000 = 2,200
- After year 2: 2,200 + 10% of 2,200 = **GH₵ 2,420**

**Bought for GH₵ 400, sold for GH₵ 460:** profit = 60, so percentage profit = 60 ÷ 400 x 100 = **15%**.

## Try it

Find the amount when GH₵ 5,000 is saved at 20% compound interest for 2 years.

*(Answer: 5,000 becomes 6,000 after one year and 7,200 after two years: GH₵ 7,200.)*
---
slug: shs3-maths-quadratic-equations
title: Quadratic equations
course: shs3-core-mathematics
description: Solve by factorising and by the formula.
syllabus_topic: shs3.maths.algebra.quadratic-equations
order: 4
duration_minutes: 12
---
# Quadratic equations

A quadratic equation has the form ax² + bx + c = 0.

- **Factorising:** find two numbers that multiply to give c (when a = 1) and add to give b. Each bracket equal to zero gives one root.
- **Formula:** x = (-b ± √(b² - 4ac)) ÷ 2a

## Worked example

**Solve x² - 5x + 6 = 0.** Two numbers that multiply to 6 and add to -5 are -2 and -3, so (x - 2)(x - 3) = 0 and **x = 2 or x = 3**.

**Solve 2x² + 3x - 2 = 0 by the formula.** a = 2, b = 3, c = -2.
b² - 4ac = 9 + 16 = 25, so x = (-3 ± 5) ÷ 4, giving **x = 1/2 or x = -2**.

## Try it

Solve x² + x - 12 = 0.

*(Answer: (x + 4)(x - 3) = 0, so x = -4 or x = 3.)*
---
slug: shs3-maths-simultaneous-equations
title: Simultaneous linear equations
course: shs3-core-mathematics
description: Solve by elimination and by substitution.
syllabus_topic: shs3.maths.algebra.simultaneous-equations
order: 5
duration_minutes: 12
---
# Simultaneous linear equations

Two equations with two unknowns are solved together.

- **Elimination:** add or subtract the equations so that one letter disappears.
- **Substitution:** make one letter the subject of one equation and put it into the other.

## Worked example

**Elimination:** x + y = 10 and x - y = 4. Adding: 2x = 14, so **x = 7**, and then y = 10 - 7 = **3**.

**Substitution:** y = 2x + 1 and 3x + y = 16. Substitute: 3x + 2x + 1 = 16, so 5x = 15, **x = 3** and y = 2 x 3 + 1 = **7**.

Always check both values in both equations.

## Try it

Solve 2x + y = 11 and x - y = 1.

*(Answer: adding gives 3x = 12, so x = 4 and y = 3.)*
---
slug: shs3-maths-sectors-arcs
title: Arc length and area of a sector
course: shs3-core-mathematics
description: Find the length of an arc and the area of a sector.
syllabus_topic: shs3.maths.mensuration.sectors-arcs
order: 6
duration_minutes: 10
---
# Arc length and area of a sector

A sector is a "slice" of a circle with angle θ at the centre. It is θ/360 of the whole circle, so:

- **Arc length** = θ/360 x 2πr
- **Area of a sector** = θ/360 x πr²

## Worked example

A circle has radius 14 cm. A sector has an angle of 90° at the centre. (Take π = 22/7.)

- The whole circumference is 2 x 22/7 x 14 = 88 cm, so the arc = 90/360 x 88 = **22 cm**.
- The whole area is 22/7 x 14 x 14 = 616 square cm, so the sector = 90/360 x 616 = **154 square cm**.

## Try it

A sector of a circle of radius 21 cm has an angle of 120° at the centre. Find the arc length and the area. (Take π = 22/7.)

*(Answer: the circumference is 132 cm, so the arc is 1/3 x 132 = 44 cm. The area of the circle is 1,386 square cm, so the sector is 1/3 x 1,386 = 462 square cm.)*
---
slug: shs3-maths-solids
title: Volume of cylinders, cones and cuboids
course: shs3-core-mathematics
description: Volume formulas for common solids.
syllabus_topic: shs3.maths.mensuration.solids
order: 7
duration_minutes: 10
---
# Volume of cylinders, cones and cuboids

| Solid | Volume |
|---|---|
| Cuboid | length x width x height |
| Cylinder | πr²h |
| Cone | 1/3 x πr²h |

The answer is in cubic units, for example cubic centimetres (cm³).

## Worked example

**A cylindrical water tank has radius 7 m and height 10 m.** Volume = 22/7 x 7 x 7 x 10 = **1,540 cubic metres**.

**A cone has radius 7 cm and height 12 cm.** Volume = 1/3 x 22/7 x 7 x 7 x 12 = 1/3 x 1,848 = **616 cubic cm**.

## Try it

Find the volume of a cylinder of radius 14 cm and height 5 cm. (Take π = 22/7.)

*(Answer: 22/7 x 14 x 14 x 5 = 3,080 cubic cm.)*
---
slug: shs3-maths-circle-theorems
title: Circle theorems
course: shs3-core-mathematics
description: The angle facts for circles.
syllabus_topic: shs3.maths.geometry.circle-theorems
order: 8
duration_minutes: 12
---
# Circle theorems

1. The angle an arc subtends at the **centre** is **twice** the angle it subtends at the circumference.
2. The angle in a **semicircle** is **90°**.
3. Angles in the **same segment** are equal.
4. Opposite angles of a **cyclic quadrilateral** add up to **180°**.

Give the reason (the theorem) for each step when you write your answer.

## Worked example

**An arc subtends 110° at the centre O.** The angle it subtends at the circumference is 110 ÷ 2 = **55°** (angle at the centre is twice the angle at the circumference).

**One angle of a cyclic quadrilateral is 75°.** The opposite angle is 180 - 75 = **105°** (opposite angles of a cyclic quadrilateral).

## Try it

An arc subtends an angle of 38° at the circumference. What angle does it subtend at the centre?

*(Answer: 2 x 38 = 76°.)*
---
slug: shs3-maths-coordinate-geometry
title: Gradient, distance and midpoint
course: shs3-core-mathematics
description: Work with two points on a graph.
syllabus_topic: shs3.maths.coordinate-geometry.gradient-distance
order: 9
duration_minutes: 10
---
# Gradient, distance and midpoint

For the points (x₁, y₁) and (x₂, y₂):

- **Gradient** = (y₂ - y₁) ÷ (x₂ - x₁)
- **Distance** = √((x₂ - x₁)² + (y₂ - y₁)²)
- **Midpoint** = ((x₁ + x₂)/2, (y₁ + y₂)/2)

## Worked example

For the points (1, 2) and (4, 6):

- Gradient = (6 - 2) ÷ (4 - 1) = **4/3**
- Distance = √(3² + 4²) = √25 = **5 units**
- Midpoint = ((1 + 4)/2, (2 + 6)/2) = **(2.5, 4)**

## Try it

For the points (2, 3) and (8, 11), find the gradient, the distance and the midpoint.

*(Answer: gradient = 8/6 = 4/3; distance = √(36 + 64) = 10 units; midpoint = (5, 7).)*
---
slug: shs3-maths-trig-ratios
title: Trigonometric ratios
course: shs3-core-mathematics
description: SOH CAH TOA and the special angles.
syllabus_topic: shs3.maths.trigonometry.trig-ratios
order: 10
duration_minutes: 12
---
# Trigonometric ratios

In a right-angled triangle, for an angle θ:

- sin θ = opposite ÷ hypotenuse
- cos θ = adjacent ÷ hypotenuse
- tan θ = opposite ÷ adjacent

Remember **SOH CAH TOA**. Useful exact values: sin 30° = 1/2, cos 60° = 1/2 and tan 45° = 1.

## Worked example

A right-angled triangle has sides 5 cm, 12 cm and 13 cm. For the angle θ opposite the 5 cm side:

- sin θ = **5/13**, cos θ = **12/13**, tan θ = **5/12**

**A ladder 10 m long makes an angle of 30° with the ground.** The height it reaches up the wall is 10 x sin 30° = 10 x 1/2 = **5 m**.

## Try it

A right-angled triangle has sides 8 cm, 15 cm and 17 cm. Find tan θ, where θ is the angle opposite the 8 cm side.

*(Answer: tan θ = 8/15.)*
---
slug: shs3-maths-statistics
title: Mean, median and mode of frequency data
course: shs3-core-mathematics
description: Work with a frequency table.
syllabus_topic: shs3.maths.statistics.statistics
order: 11
duration_minutes: 12
---
# Mean, median and mode of frequency data

In a frequency table, each value x appears f times.

- **Mean** = Σfx ÷ Σf (the sum of value x frequency, divided by the total frequency)
- **Mode** = the value with the highest frequency
- **Median** = the middle value when all the values are listed in order. Use the cumulative frequency to find it.

## Worked example

| Score (x) | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Frequency (f) | 3 | 5 | 8 | 4 |

- Σfx = 3 + 10 + 24 + 16 = 53 and Σf = 20, so the mean = 53 ÷ 20 = **2.65**
- The mode is **3** (frequency 8)
- There are 20 values, so the median is halfway between the 10th and 11th. The cumulative frequencies are 3, 8, 16, 20, so both the 10th and 11th are 3: the median is **3**.

## Try it

Find the mean of: score 2 (frequency 1), score 4 (frequency 3), score 6 (frequency 1).

*(Answer: Σfx = 2 + 12 + 6 = 20 and Σf = 5, so the mean is 4.)*
---
slug: shs3-maths-probability
title: Probability
course: shs3-core-mathematics
description: Single events, independent events and picking without replacement.
syllabus_topic: shs3.maths.statistics.probability
order: 12
duration_minutes: 12
---
# Probability

Probability = number of favourable outcomes ÷ total number of possible outcomes. It is always between 0 and 1.

- For **independent** events, P(A and B) = P(A) x P(B).
- **Without replacement**, the totals change after each pick.

## Worked example

**A fair die is thrown. P(even number)** = 3/6 = **1/2**.

**A coin is tossed and a die is thrown. P(head and a 6)** = 1/2 x 1/6 = **1/12**.

**A bag holds 3 red and 2 blue balls. Two are picked without replacement. P(both red)** = 3/5 x 2/4 = 6/20 = **3/10**.

## Try it

A bag holds 4 green and 6 yellow sweets. One is picked at random. What is the probability that it is green?

*(Answer: 4/10 = 2/5.)*
