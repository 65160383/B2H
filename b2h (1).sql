-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 22, 2026 at 07:10 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `b2h`
--

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `favorite_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`favorite_id`, `user_id`, `product_id`) VALUES
(24, 2, 29);

-- --------------------------------------------------------

--
-- Table structure for table `interests`
--

CREATE TABLE `interests` (
  `interest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interests`
--

INSERT INTO `interests` (`interest_id`, `user_id`, `product_id`, `create_time`) VALUES
(27, 2, 29, '2026-03-22 17:55:11');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` longtext DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `img_url` varchar(255) DEFAULT NULL,
  `buyer_id` int(11) DEFAULT NULL,
  `status` enum('available','reserved','selling','sold','hidden') DEFAULT 'available',
  `create_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `seller_id`, `title`, `description`, `price`, `contact`, `category`, `img_url`, `buyer_id`, `status`, `create_time`) VALUES
(29, 3, 'ำ-ไพดกห', 'ดกหดกห23', 124.00, 'LINE: 13123', 'เกม / บันเทิง', '/uploads/1774201898319-209726288.png', 2, 'sold', '2026-03-22 17:51:38');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `image_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `img_url` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report`
--

CREATE TABLE `report` (
  `report_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `target_type` enum('user','product','review') NOT NULL,
  `target_id` int(11) NOT NULL,
  `reason` longtext NOT NULL,
  `status` enum('pending','reviewed','rejected') DEFAULT 'pending',
  `create_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `admin_note` longtext DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `review_time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `report`
--

INSERT INTO `report` (`report_id`, `reporter_id`, `target_type`, `target_id`, `reason`, `status`, `create_time`, `attachments`, `admin_note`, `reviewed_by`, `review_time`) VALUES
(6, 2, 'user', 3, '2342', 'rejected', '2026-03-22 17:59:25', '[\"/uploads/1774202365440-959087728.png\"]', 'sdadsa', 4, '2026-03-22 18:05:11');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int(11) NOT NULL,
  `reviewer_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` longtext DEFAULT NULL,
  `create_time` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`review_id`, `reviewer_id`, `seller_id`, `product_id`, `rating`, `comment`, `create_time`) VALUES
(2, 2, 3, 29, 2, '432432', '2026-03-22 18:02:45');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `status` enum('active','banned') NOT NULL DEFAULT 'active',
  `create_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `password` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `contact_facebook` varchar(255) DEFAULT NULL,
  `contact_line` varchar(255) DEFAULT NULL,
  `contact_instagram` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `role`, `status`, `create_time`, `password`, `first_name`, `last_name`, `contact_facebook`, `contact_line`, `contact_instagram`, `avatar_url`) VALUES
(2, '65160245@go.buu.ac.th', 'user', 'active', '2026-03-21 11:36:02', '$2a$10$EFDxTu0VPNKUsdt.nEJvieifHSjnJtZ8ukI16AzA2J52gW85jEMce', 'Jakkapan', 'Maneela', 'Jakkapan Maneela', 'jojona', 'jojonajojonajojona', '/uploads/1774110582174-620117735.jfif'),
(3, '65160025@go.buu.ac.th', 'user', 'active', '2026-03-21 18:04:57', '$2a$10$sDBK9eh09ofX/5vL//o9C.gTq7L5kzNGfs6WKiLizn7AWHIJK1NhC', 'Tanaphoom', 'Pinthong', '21313', '13123', '13', NULL),
(4, '65160383@go.buu.ac.th', 'admin', 'active', '2026-03-21 18:05:36', '$2a$10$47ZrSiASUnIRa70FR9TLsOzW4WbFZotkQtS.jKB1sbsGedC1JrSzO', 'Pacharaphon', 'Saraphan', NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`favorite_id`),
  ADD UNIQUE KEY `uk_user_product` (`user_id`,`product_id`),
  ADD KEY `fk_favorites_product` (`product_id`);

--
-- Indexes for table `interests`
--
ALTER TABLE `interests`
  ADD PRIMARY KEY (`interest_id`),
  ADD UNIQUE KEY `uk_user_product_interest` (`user_id`,`product_id`),
  ADD KEY `fk_interests_product` (`product_id`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `fk_product_seller` (`seller_id`),
  ADD KEY `fk_product_buyer` (`buyer_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `fk_product_images_product` (`product_id`);

--
-- Indexes for table `report`
--
ALTER TABLE `report`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `fk_report_reporter` (`reporter_id`),
  ADD KEY `fk_report_reviewer` (`reviewed_by`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `fk_reviews_reviewer` (`reviewer_id`),
  ADD KEY `fk_reviews_seller` (`seller_id`),
  ADD KEY `fk_reviews_product` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `favorite_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `interests`
--
ALTER TABLE `interests`
  MODIFY `interest_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report`
--
ALTER TABLE `report`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_favorites_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `interests`
--
ALTER TABLE `interests`
  ADD CONSTRAINT `fk_interests_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_interests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `fk_product_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_product_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `report`
--
ALTER TABLE `report`
  ADD CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_report_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
