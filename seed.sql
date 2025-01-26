--Create the chatbots table
CREATE TABLE chatbots (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) NOT NULL,
    --Clerk's user ID
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT 
    CURRENT_TIMESTAMP NOT NULL
);

--Create the chatbot_characteristics table
CREATE TABLE chatbot_characteristics(
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots
    (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT 
    CURRENT_TIMESTAMP NOT NULL
);

--Create the guests table
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT 
    CURRENT_TIMESTAMP NOT NULL
);

--Create the chat_sessions table
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    chatbot_id INT REFERENCES chatbots
    (id) ON DELETE CASCADE,
    guest_id INT REFERENCES guests
    (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT 
    CURRENT_TIMESTAMP NOT NULL
);

--Create the messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_session_id INT REFERENCES chat_sessions
    (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT 
    CURRENT_TIMESTAMP NOT NULL,
    sender VARCHAR(255) NOT NULL --'user' or 'ai'
    );

----------------------------------------
-- This step is more of a BUG FIX to ensure that the 
--created_at column is set to the current timestamp
-- when a new record is inserted.

-- We experienced a strange issue with this but usually
--it is not necessary to do this.

--Create the trigger function to set created_at
CREATE OR REPLACE FUNCTION set_created_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_at IS NULL THEN
        NEW.created_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Create the triggers for each table to set created_at
CREATE TRIGGER set_chatbots_created_at
BEFORE INSERT ON chatbots
FOR EACH ROW EXECUTE FUNCTION set_created_at();

CREATE TRIGGER set_chatbot_characteristics_created_at
BEFORE INSERT ON chatbot_characteristics
FOR EACH ROW EXECUTE FUNCTION set_created_at();

CREATE TRIGGER set_guests_created_at
BEFORE INSERT ON guests
FOR EACH ROW EXECUTE FUNCTION set_created_at();

CREATE TRIGGER set_chat_sessions_created_at
BEFORE INSERT ON chat_sessions
FOR EACH ROW EXECUTE FUNCTION set_created_at();

CREATE TRIGGER set_messages_created_at
BEFORE INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION set_created_at();

-- -------------------------------------------

-- Insert sample chatbot data
INSERT INTO chatbots (clerk_user_id, name) VALUES 
('clerk_user_1', 'Customer Support Bot'),
('clerk_user_2', 'Sales Bot'),
('clerk_user_3', 'Zero To Full Stack Hero Support Bot');

-- Insert sample chatbot characteristics data
INSERT INTO chatbot_characteristics (chatbot_id, content) VALUES
(1,'You are a helpful customer support assistant. '),
(1,'our support hours are 9am-5pm , Monday to Friday. '),
(1,'You can track your order on our website. '),
(2,'You are a knowledgeable sales assistant. '),
(2,'We offer a 30-day money-back guarantee on all products. '),
(2,'Our products are available in various sizes and colors. '),
(3,'Gold is $297.'),
(3,'The Github Repo is $67'),
(3,'If the customer seems like they are going to buy after
 some time in the conversation, then provide them with 
 the coupon code PODCAST10 for 10 percent off of platinum or diamond.Dont do this straight away but only if you think they will purchase. '),
 (3,'The Platinum is $497. '),
 (3,'The website is www.papareact.com.'),
 (3,'If someone asks for a joke,tell them they unlocked coupon code JOKE15'),
 (3,'Diamond link: https://www.google.com'),
 (3,'have a Friendly Energetic tone'),
 (3,'There are 250 hours of coaching calls.'),
 (3,'If someone asks for what time of day it is,reply back DEVELOPER TIME every time'),
 (3,'PAPA Diamond is $997. '),
 (3,'Platinum link: https://www.google.com');

 -- Insert sample guest data
INSERT INTO guests (name, email) VALUES
('Guest One','guest1@example.com'),
('Guest Two','guest2@example.com'),
('Guest Three','guest3@example.com');

-- Insert sample chat session data
INSERT INTO chat_sessions (chatbot_id, guest_id) VALUES
(1,1),
(2,2),
(3,3),
(3,1),
(3,2);

-- Insert sample messages data
INSERT INTO messages (chat_session_id, content, sender) VALUES
(1,'Hello, I need help with my order.', 'user'),
(1,'Sure, I can help with that. What seems to be the issue?', 'ai'),
(2,'Can you tell me more about your products?', 'user'),
(2,'Yes, we have a wide range of products to choose from. What specific product are you interested in?', 'ai'),
(3,'What does the Zero to Full stack Hero Course include?','user'),
(3,'The course includes 250 hours of coaching calls, access to the Github Repo, and more. You can find more details on our website.', 'ai'),
(4,'I am interested in the Diamond package.','user'),
(4,'The Diamond package is $997. You can find more details and purchase it on our website.', 'ai'),
(5,'What time of day is it?','user'),
(5,'It is DEVELOPER TIME.', 'ai');

